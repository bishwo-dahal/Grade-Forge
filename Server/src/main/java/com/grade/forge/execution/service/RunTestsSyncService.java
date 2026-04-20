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
import java.nio.file.attribute.PosixFilePermission;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

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

    /** Optional container user:group (e.g. 1000:1000). If blank, Docker's default user is used. */
    @Value("${run.tests.docker.user:}")
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

    /**
     * Base directory for temporary workspaces used when running tests in Docker.
     * In containerized deployments, this should point to a host-mounted volume so
     * the Docker daemon can see the files (e.g. /var/gradeforge/work).
     */
    @Value("${run.tests.work-dir-base:/tmp}")
    private String workDirBaseDir;

    private final AssignmentRepository assignmentRepository;
    private final TestCaseRepository testCaseRepository;

    /**
     * Run tests on the given files for the assignment. Uses the assignment's programming language
     * (docker image, compile command, execution code) to run code; no hardcoded Python/Java.
     * When customStdin is non-blank, one additional run with that input is appended to results (for students).
     */
    @Transactional(readOnly = true)
    public TestRunJobStatusResponse runTests(Long assignmentId, List<MultipartFile> files, String customStdin) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + assignmentId));

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

        // Run all test cases (public + private). Student-facing APIs filter private elsewhere.
        // If the assignment has no test suite, treat it as "no tests" and allow a single ad-hoc run.
        List<TestCase> testCases = assignment.getTestSuite() == null
                ? List.of()
                : testCaseRepository.findByTestSuite_Id(assignment.getTestSuite().getId());
        boolean hasCustomStdin = customStdin != null && !customStdin.isBlank();

        // NOTE: If there are no test cases, still allow students to "Run" their code once
        // (with empty stdin unless they provided customStdin).
        boolean shouldRunAdhoc = testCases.isEmpty();

        Path workDir;
        try {
            Path baseDir = Path.of(workDirBaseDir).toAbsolutePath().normalize();
            Files.createDirectories(baseDir);
            workDir = Files.createTempDirectory(baseDir, "run-tests-");
            setWorldWritableForRun(workDir);
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
            // Ad-hoc run: when no tests exist, run once (empty stdin or customStdin).
            if (shouldRunAdhoc) {
                results.add(runOneAdhocRun(workDir, language, mainFile, mainClass,
                        hasCustomStdin ? customStdin : "", hasCustomStdin ? "Custom input" : "Run"));
            } else if (hasCustomStdin) {
                // Optional custom stdin run (e.g. for students to try their own input).
                results.add(runOneAdhocRun(workDir, language, mainFile, mainClass, customStdin, "Custom input"));
            }

            int passed = (int) results.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
            int totalCount = results.size();
            return TestRunJobStatusResponse.builder()
                    .id(null)
                    .submissionId(null)
                    .status(TestRunJobStatus.COMPLETED)
                    .results(results)
                    .passedCount(passed)
                    .totalCount(totalCount)
                    .build();
        } catch (Exception e) {
            log.warn("Run tests failed for assignment {}", assignmentId, e);
            int plannedTotal = testCases.size() + ((shouldRunAdhoc || hasCustomStdin) ? 1 : 0);
            return TestRunJobStatusResponse.builder()
                    .id(null)
                    .submissionId(null)
                    .status(TestRunJobStatus.FAILED)
                    .errorMessage(e.getMessage() != null ? e.getMessage() : "Test execution failed")
                    .results(List.of())
                    .passedCount(0)
                    .totalCount(plannedTotal)
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
        String inputFileName = tc.getFileName();
        DockerRunResult run = executeInDocker(workDir, language, mainFile, mainClass, input,
                (inputFileName != null && !inputFileName.isBlank()) ? inputFileName : null, start);
        if (run.setupError != null) {
            return failResult(tc, start, run.setupError);
        }
        String actual = run.output != null ? run.output.trim() : "";
        String expected = (tc.getOutput() != null ? tc.getOutput() : "").trim();
        boolean passed = run.exitCode == 0 && actual.equals(expected);
        return TestCaseResultItem.builder()
                .testCaseId(tc.getId())
                .testCaseTitle(tc.getTitle())
                .passed(passed)
                .actualOutput(actual)
                .expectedOutput(tc.getOutput())
                .timedOut(run.timedOut)
                .errorMessage(run.errorMessage)
                .runtimeMs(run.runtimeMs)
                .isPrivate(Boolean.TRUE.equals(tc.getIsPrivate()))
                .build();
    }

    /**
     * Run once without a test case ("ad-hoc run"). Used when there are no tests, or when students provide custom stdin.
     * Returns a result with no expected output, and passed=null.
     */
    private TestCaseResultItem runOneAdhocRun(
            Path workDir,
            ProgrammingLanguage language,
            String mainFile,
            String mainClass,
            String stdin,
            String title) {
        long start = System.currentTimeMillis();
        DockerRunResult run = executeInDocker(workDir, language, mainFile, mainClass, stdin != null ? stdin : "", null, start);
        if (run.setupError != null) {
            return adhocRunFailResult(start, title, run.setupError);
        }
        String actual = run.output != null ? run.output.trim() : "";
        return TestCaseResultItem.builder()
                .testCaseId(null)
                .testCaseTitle(title != null && !title.isBlank() ? title : "Run")
                .passed(null)
                .actualOutput(actual)
                .expectedOutput(null)
                .timedOut(run.timedOut)
                .errorMessage(run.errorMessage)
                .runtimeMs(run.runtimeMs)
                .isPrivate(null)
                .build();
    }

    private static TestCaseResultItem adhocRunFailResult(long start, String title, String errorMessage) {
        return TestCaseResultItem.builder()
                .testCaseId(null)
                .testCaseTitle(title != null && !title.isBlank() ? title : "Run")
                .passed(null)
                .actualOutput(null)
                .expectedOutput(null)
                .timedOut(false)
                .errorMessage(errorMessage)
                .runtimeMs(System.currentTimeMillis() - start)
                .isPrivate(null)
                .build();
    }

    /**
     * Single place for Docker run: write stdin (and optional input file), build script, run container.
     * Returns a result with setupError set if something failed before or during run; otherwise output/exitCode/timedOut/runtimeMs.
     */
    private DockerRunResult executeInDocker(Path workDir, ProgrammingLanguage language, String mainFile, String mainClass,
                                            String input, String inputFileNameForFile, long start) {
        String compileCommand = language.getCompileCommand();
        String executionCode = language.getExecutionCode();
        if (executionCode == null || executionCode.isBlank()) {
            return new DockerRunResult("Language has no execution code configured.", null, -1, false, System.currentTimeMillis() - start);
        }
        String compileCmd = (compileCommand != null && !compileCommand.isBlank())
                ? substitute(compileCommand, mainFile, mainClass)
                : null;
        String execCmd = substitute(executionCode, mainFile, mainClass);

        try {
            Path stdinPath = workDir.resolve(DOCKER_STDIN_FILE);
            Files.writeString(stdinPath, input, StandardCharsets.UTF_8);
            setWorldReadableAndExecutable(stdinPath);
            if (inputFileNameForFile != null && !inputFileNameForFile.isBlank()) {
                String safeName = sanitizeFilename(inputFileNameForFile);
                Path inputFilePath = workDir.resolve(safeName);
                Files.writeString(inputFilePath, input, StandardCharsets.UTF_8);
                setWorldReadableAndExecutable(inputFilePath);
            }
        } catch (Exception e) {
            return new DockerRunResult("Failed to write stdin: " + e.getMessage(), null, -1, false, System.currentTimeMillis() - start);
        }

        StringBuilder script = new StringBuilder("set -e\n");
        if (compileCmd != null) {
            script.append(compileCmd).append("\n");
        }
        script.append(execCmd).append(" < ").append(DOCKER_STDIN_FILE).append("\n");
        Path scriptPath = workDir.resolve(DOCKER_SCRIPT_FILE);
        try {
            Files.writeString(scriptPath, script.toString(), StandardCharsets.UTF_8);
            setWorldReadableAndExecutable(scriptPath);
        } catch (Exception e) {
            return new DockerRunResult("Failed to write run script: " + e.getMessage(), null, -1, false, System.currentTimeMillis() - start);
        }

        String workDirAbs = workDir.toAbsolutePath().normalize().toString();
        String memoryLimit = dockerMemoryMb + "m";
        String containerName = "run-tests-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");
        cmd.add("--rm");
        cmd.add("--name");
        cmd.add(containerName);
        cmd.add("--network");
        cmd.add("none");
        if (dockerRunUser != null && !dockerRunUser.trim().isEmpty()) {
            cmd.add("--user");
            cmd.add(dockerRunUser.trim());
        }
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
                String timeoutMsg = "Execution timed out after " + RUN_TIMEOUT_SECONDS + "s";
                return new DockerRunResult(timeoutMsg, null, -1, true, runtime, timeoutMsg);
            }
            String output = readStream(process.getInputStream());
            int exit = process.exitValue();
            String runError = exit != 0 ? "Container exited with code " + exit + (output != null && !output.isBlank() ? ": " + output.trim() : "") : null;
            return new DockerRunResult(null, output, exit, false, runtime, runError);
        } catch (Exception e) {
            killContainer(containerName);
            String msg = "Docker execution failed: " + e.getMessage();
            return new DockerRunResult(msg, null, -1, false, System.currentTimeMillis() - start, msg);
        }
    }

    /** Result of a single Docker run. setupError non-null = setup or run failed before producing a result. */
    private static final class DockerRunResult {
        final String setupError;
        final String output;
        final int exitCode;
        final boolean timedOut;
        final long runtimeMs;
        /** Error message when exitCode != 0 or timedOut (for display in result). */
        final String errorMessage;

        DockerRunResult(String setupError, String output, int exitCode, boolean timedOut, long runtimeMs, String errorMessage) {
            this.setupError = setupError;
            this.output = output;
            this.exitCode = exitCode;
            this.timedOut = timedOut;
            this.runtimeMs = runtimeMs;
            this.errorMessage = errorMessage;
        }

        /** For setup failures we only have setupError; errorMessage is derived. */
        DockerRunResult(String setupError, String output, int exitCode, boolean timedOut, long runtimeMs) {
            this(setupError, output, exitCode, timedOut, runtimeMs, setupError);
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
                .isPrivate(Boolean.TRUE.equals(tc.getIsPrivate()))
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

    /** Make path world-readable and -executable (e.g. for run.sh, stdin.txt). */
    private static void setWorldReadableAndExecutable(Path path) {
        try {
            Set<PosixFilePermission> perms = EnumSet.of(
                    PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE, PosixFilePermission.OWNER_EXECUTE,
                    PosixFilePermission.GROUP_READ, PosixFilePermission.GROUP_EXECUTE,
                    PosixFilePermission.OTHERS_READ, PosixFilePermission.OTHERS_EXECUTE
            );
            Files.setPosixFilePermissions(path, perms);
        } catch (UnsupportedOperationException e) {
            // Non-POSIX filesystem (e.g. Windows); skip, container may still work
        } catch (Exception e) {
            log.debug("Could not set permissions on {}: {}", path, e.getMessage());
        }
    }

    /**
     * Make directory world-writable (rwxrwxrwx) so the container user can write build outputs (e.g. .class files).
     * Used only for the temp run directory; it is deleted immediately after the run.
     */
    private static void setWorldWritableForRun(Path dir) {
        try {
            Set<PosixFilePermission> perms = EnumSet.of(
                    PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE, PosixFilePermission.OWNER_EXECUTE,
                    PosixFilePermission.GROUP_READ, PosixFilePermission.GROUP_WRITE, PosixFilePermission.GROUP_EXECUTE,
                    PosixFilePermission.OTHERS_READ, PosixFilePermission.OTHERS_WRITE, PosixFilePermission.OTHERS_EXECUTE
            );
            Files.setPosixFilePermissions(dir, perms);
        } catch (UnsupportedOperationException e) {
            // Non-POSIX filesystem (e.g. Windows); skip
        } catch (Exception e) {
            log.debug("Could not set permissions on {}: {}", dir, e.getMessage());
        }
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
