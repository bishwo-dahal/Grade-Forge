package com.grade.forge.execution.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.execution.dto.TestCaseResultItem;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.enums.TestRunJobStatus;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.testsuite.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Runs tests only inside Docker containers. Uses the assignment's programming language
 * (docker_image, compile_command, execution_code from the language table). Code never runs on the host.
 * Language must have a non-blank docker_image; images are pre-pulled at startup.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RunTestsSyncService {

    private static final int RUN_TIMEOUT_SECONDS = 15;
    private static final String PLACEHOLDER_MAIN_FILE = "{{main_file}}";
    private static final String PLACEHOLDER_MAIN_CLASS = "{{main_class}}";
    private static final String DOCKER_STDIN_FILE = "stdin.txt";
    private static final String DOCKER_SCRIPT_FILE = "run.sh";
    private static final String DOCKER_WORK_MOUNT = "/work";

    /** Run container as this user:group (e.g. 1000:1000). Use same UID as the app process so the mounted work dir is writable. */
    @Value("${run.tests.docker.user:1000:1000}")
    private String dockerRunUser;

    /** Max memory for each run container (e.g. 256m). */
    @Value("${run.tests.docker.memory-mb:256}")
    private int dockerMemoryMb;

    /** Max CPUs (e.g. 1 or 0.5). */
    @Value("${run.tests.docker.cpus:1}")
    private String dockerCpus;

    /** Max number of processes (pids) in the container. */
    @Value("${run.tests.docker.pids-limit:50}")
    private int dockerPidsLimit;

    private final AssignmentRepository assignmentRepository;
    private final TestCaseRepository testCaseRepository;

    /**
     * Run tests on the given files for the assignment. Uses the assignment's programming language
     * (docker image, compile command, execution code) to run code; no hardcoded Python/Java.
     */
    @Transactional(readOnly = true)
    public TestRunJobStatusResponse runTests(Long assignmentId, List<MultipartFile> files) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + assignmentId));

        if (assignment.getTestSuite() == null) {
            throw new IllegalArgumentException("Assignment has no test suite; cannot run tests.");
        }

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one file is required.");
        }

        ProgrammingLanguage language = assignment.getProgrammingLanguage();
        if (language == null) {
            throw new IllegalArgumentException("Assignment has no programming language; cannot run tests.");
        }
        String dockerImage = language.getDockerImage();
        if (dockerImage == null || dockerImage.isBlank()) {
            throw new IllegalArgumentException("Language '" + language.getName() + "' has no Docker image configured; execution is only allowed in containers.");
        }
        String executionCode = language.getExecutionCode();
        if (executionCode == null || executionCode.isBlank()) {
            throw new IllegalArgumentException("Language '" + language.getName() + "' has no execution code configured.");
        }

        List<TestCase> testCases = testCaseRepository.findByTestSuite_Id(assignment.getTestSuite().getId()).stream()
                .filter(tc -> !Boolean.TRUE.equals(tc.getIsPrivate()))
                .collect(Collectors.toList());

        if (testCases.isEmpty()) {
            return TestRunJobStatusResponse.builder()
                    .id(null)
                    .submissionId(null)
                    .status(TestRunJobStatus.COMPLETED)
                    .results(List.of())
                    .passedCount(0)
                    .totalCount(0)
                    .build();
        }

        Path workDir;
        try {
            workDir = Files.createTempDirectory("run-tests-");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create temp directory", e);
        }

        try {
            String mainFile = null;
            for (MultipartFile f : files) {
                if (f.getOriginalFilename() == null || f.getOriginalFilename().isBlank()) continue;
                String safeName = sanitizeFilename(f.getOriginalFilename());
                Path dest = workDir.resolve(safeName);
                Files.write(dest, f.getBytes());
                if (mainFile == null) {
                    mainFile = safeName;
                }
            }

            if (mainFile == null) {
                throw new IllegalArgumentException("No valid file names in upload.");
            }

            String mainClass = mainFile.replaceFirst("\\.[^.]+$", ""); // strip extension for Java-style main class

            List<TestCaseResultItem> results = new ArrayList<>();
            for (TestCase tc : testCases) {
                results.add(runOneTest(workDir, language, mainFile, mainClass, tc));
            }

            int passed = (int) results.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
            return TestRunJobStatusResponse.builder()
                    .id(null)
                    .submissionId(null)
                    .status(TestRunJobStatus.COMPLETED)
                    .results(results)
                    .passedCount(passed)
                    .totalCount(results.size())
                    .build();
        } catch (Exception e) {
            log.warn("Run tests failed for assignment {}", assignmentId, e);
            return TestRunJobStatusResponse.builder()
                    .id(null)
                    .submissionId(null)
                    .status(TestRunJobStatus.FAILED)
                    .errorMessage(e.getMessage() != null ? e.getMessage() : "Test execution failed")
                    .results(List.of())
                    .passedCount(0)
                    .totalCount(testCases.size())
                    .build();
        } finally {
            deleteRecursively(workDir);
        }
    }

    /**
     * Normalize an uploaded filename so it cannot escape the temp directory.
     * Strips any path components and collapses dangerous patterns; falls back to a simple name if needed.
     */
    private static String sanitizeFilename(String original) {
        String name = original;
        // Normalize separators to forward slashes and drop any path components.
        name = name.replace("\\", "/");
        int lastSlash = name.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash + 1 < name.length()) {
            name = name.substring(lastSlash + 1);
        }
        // Remove any remaining parent-directory tokens.
        while (name.contains("..")) {
            name = name.replace("..", "");
        }
        // Fallback if we stripped everything or got an empty/invalid name.
        if (name.isBlank()) {
            return "main";
        }
        return name;
    }

    private TestCaseResultItem runOneTest(Path workDir, ProgrammingLanguage language, String mainFile, String mainClass, TestCase tc) {
        String input = tc.getInput() != null ? tc.getInput() : "";
        long start = System.currentTimeMillis();
        return runOneTestInDocker(workDir, language, mainFile, mainClass, input, tc, start);
    }

    /**
     * Run compile + execution inside the language's Docker image. Writes stdin to a file and runs a script in the container.
     */
    private TestCaseResultItem runOneTestInDocker(Path workDir, ProgrammingLanguage language, String mainFile, String mainClass, String input, TestCase tc, long start) {
        String compileCommand = language.getCompileCommand();
        String executionCode = language.getExecutionCode();
        if (executionCode == null || executionCode.isBlank()) {
            return failResult(tc, start, "Language has no execution code configured.");
        }
        String compileCmd = (compileCommand != null && !compileCommand.isBlank())
                ? substitute(compileCommand, mainFile, mainClass)
                : null;
        String execCmd = substitute(executionCode, mainFile, mainClass);

        try {
            Files.writeString(workDir.resolve(DOCKER_STDIN_FILE), input, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return failResult(tc, start, "Failed to write stdin: " + e.getMessage());
        }

        // Script: compile (if any) then run with stdin; inside container /work is the mounted workDir
        StringBuilder script = new StringBuilder("set -e\n");
        if (compileCmd != null) {
            script.append(compileCmd).append("\n");
        }
        script.append(execCmd).append(" < ").append(DOCKER_STDIN_FILE).append("\n");
        try {
            Files.writeString(workDir.resolve(DOCKER_SCRIPT_FILE), script.toString(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return failResult(tc, start, "Failed to write run script: " + e.getMessage());
        }

        String workDirAbs = workDir.toAbsolutePath().normalize().toString();
        String memoryLimit = dockerMemoryMb + "m";
        String containerName = "run-tests-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        // Lowest privilege: non-root user, no new privileges, drop all caps, read-only root, resource limits
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("--rm");
        cmd.add("--name");
        cmd.add(containerName);
        cmd.add("--network");
        cmd.add("none");
        cmd.add("--user");
        cmd.add(dockerRunUser.trim());
        cmd.add("--memory");
        cmd.add(memoryLimit);
        cmd.add("--memory-swap");
        cmd.add(memoryLimit);
        cmd.add("--cpus");
        cmd.add(dockerCpus.trim());
        cmd.add("--pids-limit");
        cmd.add(String.valueOf(dockerPidsLimit));
        cmd.add("--security-opt");
        cmd.add("no-new-privileges:true");
        cmd.add("--cap-drop");
        cmd.add("ALL");
        cmd.add("--read-only");
        cmd.add("--tmpfs");
        cmd.add("/tmp:size=64M,mode=1777");
        cmd.add("-v");
        cmd.add(workDirAbs + ":" + DOCKER_WORK_MOUNT);
        cmd.add("-w");
        cmd.add(DOCKER_WORK_MOUNT);
        cmd.add(language.getDockerImage().trim());
        cmd.add("sh");
        cmd.add(DOCKER_SCRIPT_FILE);
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        try {
            Process process = pb.start();
            boolean finished = process.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long runtime = System.currentTimeMillis() - start;

            if (!finished) {
                process.destroyForcibly();
                killContainer(containerName);
                return TestCaseResultItem.builder()
                        .testCaseId(tc.getId())
                        .testCaseTitle(tc.getTitle())
                        .passed(false)
                        .actualOutput(null)
                        .expectedOutput(tc.getOutput())
                        .timedOut(true)
                        .errorMessage("Execution timed out after " + RUN_TIMEOUT_SECONDS + "s")
                        .runtimeMs(runtime)
                        .build();
            }
            String output = readStream(process.getInputStream());
            String actual = output != null ? output.trim() : "";
            String expected = (tc.getOutput() != null ? tc.getOutput() : "").trim();
            int exit = process.exitValue();
            return TestCaseResultItem.builder()
                    .testCaseId(tc.getId())
                    .testCaseTitle(tc.getTitle())
                    .passed(exit == 0 && actual.equals(expected))
                    .actualOutput(actual)
                    .expectedOutput(tc.getOutput())
                    .timedOut(false)
                    .errorMessage(exit != 0 ? "Container exited with code " + exit + (output != null && !output.isBlank() ? ": " + output.trim() : "") : null)
                    .runtimeMs(runtime)
                    .build();
        } catch (Exception e) {
            killContainer(containerName);
            return failResult(tc, start, "Docker execution failed: " + e.getMessage());
        }
    }

    /** Stop the container so it does not keep running after we time out or fail. */
    private void killContainer(String containerName) {
        try {
            ProcessBuilder killPb = new ProcessBuilder("docker", "kill", containerName);
            killPb.redirectErrorStream(true);
            Process killProcess = killPb.start();
            killProcess.waitFor(5, TimeUnit.SECONDS);
            if (!killProcess.isAlive() && killProcess.exitValue() != 0) {
                log.debug("docker kill {} exited with {} (container may already have stopped)", containerName, killProcess.exitValue());
            }
        } catch (Exception e) {
            log.warn("Failed to kill container {}: {}", containerName, e.getMessage());
        }
    }

    private static TestCaseResultItem failResult(TestCase tc, long start, String errorMessage) {
        return TestCaseResultItem.builder()
                .testCaseId(tc.getId())
                .testCaseTitle(tc.getTitle())
                .passed(false)
                .actualOutput(null)
                .expectedOutput(tc.getOutput())
                .timedOut(false)
                .errorMessage(errorMessage)
                .runtimeMs(System.currentTimeMillis() - start)
                .build();
    }

    private static String substitute(String template, String mainFile, String mainClass) {
        if (template == null) return "";
        return template
                .replace(PLACEHOLDER_MAIN_FILE, mainFile)
                .replace(PLACEHOLDER_MAIN_CLASS, mainClass);
    }

    private static String readStream(InputStream in) throws java.io.IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toString(StandardCharsets.UTF_8);
    }

    private static void deleteRecursively(Path path) {
        try {
            if (Files.isDirectory(path)) {
                Files.list(path).forEach(RunTestsSyncService::deleteRecursively);
            }
            Files.deleteIfExists(path);
        } catch (Exception e) {
            log.debug("Could not delete temp path {}", path, e);
        }
    }
}
