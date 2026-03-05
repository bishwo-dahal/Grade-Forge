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
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Runs tests synchronously using the assignment's programming language from the language table.
 * Files are written to a temp dir; compile (if any) and execution commands are taken from
 * the language's compileCommand and executionCode (with {{main_file}} / {{main_class}} substituted).
 * Supports any language configured in the language table (Python, Java, C++, etc.).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RunTestsSyncService {

    private static final int RUN_TIMEOUT_SECONDS = 15;
    private static final String PLACEHOLDER_MAIN_FILE = "{{main_file}}";
    private static final String PLACEHOLDER_MAIN_CLASS = "{{main_class}}";

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
                Path dest = workDir.resolve(f.getOriginalFilename());
                Files.write(dest, f.getBytes());
                if (mainFile == null) {
                    mainFile = f.getOriginalFilename();
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

    private TestCaseResultItem runOneTest(Path workDir, ProgrammingLanguage language, String mainFile, String mainClass, TestCase tc) {
        String input = tc.getInput() != null ? tc.getInput() : "";
        long start = System.currentTimeMillis();

        String compileCommand = language.getCompileCommand();
        if (compileCommand != null && !compileCommand.isBlank()) {
            String compileCmd = substitute(compileCommand, mainFile, mainClass);
            TestCaseResultItem compileResult = runCompile(workDir, compileCmd, tc, start);
            if (compileResult != null) {
                return compileResult;
            }
        }

        String executionCode = language.getExecutionCode();
        if (executionCode == null || executionCode.isBlank()) {
            return TestCaseResultItem.builder()
                    .testCaseId(tc.getId())
                    .testCaseTitle(tc.getTitle())
                    .passed(false)
                    .actualOutput(null)
                    .expectedOutput(tc.getOutput())
                    .timedOut(false)
                    .errorMessage("Language has no execution code configured.")
                    .runtimeMs(System.currentTimeMillis() - start)
                    .build();
        }

        String execCmd = substitute(executionCode, mainFile, mainClass);
        return runExecution(workDir, execCmd, input, tc, start);
    }

    private static String substitute(String template, String mainFile, String mainClass) {
        if (template == null) return "";
        return template
                .replace(PLACEHOLDER_MAIN_FILE, mainFile)
                .replace(PLACEHOLDER_MAIN_CLASS, mainClass);
    }

    private static boolean isWindows() {
        String os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        return os.contains("win");
    }

    /**
     * Run compile command in workDir. Returns a failed result if compile fails or times out; returns null if compile succeeded.
     */
    private TestCaseResultItem runCompile(Path workDir, String compileCmd, TestCase tc, long start) {
        ProcessBuilder pb = isWindows()
                ? new ProcessBuilder("cmd.exe", "/c", compileCmd)
                : new ProcessBuilder("/bin/sh", "-c", compileCmd);
        pb.redirectErrorStream(true);
        pb.directory(workDir.toFile());
        try {
            Process process = pb.start();
            boolean finished = process.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long runtime = System.currentTimeMillis() - start;

            if (!finished) {
                process.destroyForcibly();
                return TestCaseResultItem.builder()
                        .testCaseId(tc.getId())
                        .testCaseTitle(tc.getTitle())
                        .passed(false)
                        .actualOutput(null)
                        .expectedOutput(tc.getOutput())
                        .timedOut(true)
                        .errorMessage("Compilation timed out after " + RUN_TIMEOUT_SECONDS + "s")
                        .runtimeMs(runtime)
                        .build();
            }
            if (process.exitValue() != 0) {
                String err = readStream(process.getInputStream());
                return TestCaseResultItem.builder()
                        .testCaseId(tc.getId())
                        .testCaseTitle(tc.getTitle())
                        .passed(false)
                        .actualOutput(null)
                        .expectedOutput(tc.getOutput())
                        .timedOut(false)
                        .errorMessage("Compilation failed: " + (err != null && !err.isBlank() ? err.trim() : "exit " + process.exitValue()))
                        .runtimeMs(runtime)
                        .build();
            }
            return null; // success, caller continues to execution
        } catch (Exception e) {
            return TestCaseResultItem.builder()
                    .testCaseId(tc.getId())
                    .testCaseTitle(tc.getTitle())
                    .passed(false)
                    .actualOutput(null)
                    .expectedOutput(tc.getOutput())
                    .timedOut(false)
                    .errorMessage(e.getMessage())
                    .runtimeMs(System.currentTimeMillis() - start)
                    .build();
        }
    }

    /**
     * Run execution command in workDir with input on stdin; compare stdout to expected output.
     */
    private TestCaseResultItem runExecution(Path workDir, String execCmd, String input, TestCase tc, long start) {
        ProcessBuilder pb = isWindows()
                ? new ProcessBuilder("cmd.exe", "/c", execCmd)
                : new ProcessBuilder("/bin/sh", "-c", execCmd);
        pb.redirectErrorStream(true);
        pb.directory(workDir.toFile());
        try {
            Process process = pb.start();
            process.getOutputStream().write(input.getBytes(StandardCharsets.UTF_8));
            process.getOutputStream().close();
            boolean finished = process.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long runtime = System.currentTimeMillis() - start;

            if (!finished) {
                process.destroyForcibly();
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
            return TestCaseResultItem.builder()
                    .testCaseId(tc.getId())
                    .testCaseTitle(tc.getTitle())
                    .passed(actual.equals(expected))
                    .actualOutput(actual)
                    .expectedOutput(tc.getOutput())
                    .timedOut(false)
                    .errorMessage(process.exitValue() != 0 ? "Process exited with code " + process.exitValue() : null)
                    .runtimeMs(runtime)
                    .build();
        } catch (Exception e) {
            return TestCaseResultItem.builder()
                    .testCaseId(tc.getId())
                    .testCaseTitle(tc.getTitle())
                    .passed(false)
                    .actualOutput(null)
                    .expectedOutput(tc.getOutput())
                    .timedOut(false)
                    .errorMessage(e.getMessage())
                    .runtimeMs(System.currentTimeMillis() - start)
                    .build();
        }
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
