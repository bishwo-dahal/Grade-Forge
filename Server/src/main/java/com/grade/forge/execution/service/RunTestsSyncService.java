package com.grade.forge.execution.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.execution.dto.TestCaseResultItem;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.enums.TestRunJobStatus;
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
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Runs tests synchronously: files from request are written to a temp dir,
 * executed against the assignment's public test cases, result returned.
 * No S3, no submission, no queue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RunTestsSyncService {

    private static final int RUN_TIMEOUT_SECONDS = 15;

    private final AssignmentRepository assignmentRepository;
    private final TestCaseRepository testCaseRepository;

    /**
     * Run tests on the given files for the assignment. Files are kept only in a temp dir for the duration of the run.
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
            boolean isPython = false;
            for (MultipartFile f : files) {
                if (f.getOriginalFilename() == null || f.getOriginalFilename().isBlank()) continue;
                Path dest = workDir.resolve(f.getOriginalFilename());
                Files.write(dest, f.getBytes());
                if (mainFile == null) {
                    mainFile = f.getOriginalFilename();
                    isPython = mainFile.toLowerCase().endsWith(".py");
                }
            }

            if (mainFile == null) {
                throw new IllegalArgumentException("No valid file names in upload.");
            }

            List<TestCaseResultItem> results = new ArrayList<>();
            for (TestCase tc : testCases) {
                results.add(runOneTest(workDir, mainFile, isPython, tc));
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

    private TestCaseResultItem runOneTest(Path workDir, String mainFile, boolean isPython, TestCase tc) {
        String input = tc.getInput() != null ? tc.getInput() : "";
        long start = System.currentTimeMillis();

        if (isPython) {
            return runPythonTest(workDir, mainFile, tc, input, start);
        } else {
            return runJavaTest(workDir, mainFile, tc, input, start);
        }
    }

    private TestCaseResultItem runPythonTest(Path workDir, String mainFile, TestCase tc, String input, long start) {
        ProcessBuilder pb = new ProcessBuilder("python3", workDir.resolve(mainFile).toString());
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
            String actual = output.trim();
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

    private TestCaseResultItem runJavaTest(Path workDir, String mainFile, TestCase tc, String input, long start) {
        try {
            ProcessBuilder compile = new ProcessBuilder("javac", "-d", workDir.toString(),
                    workDir.resolve(mainFile).toString());
            compile.redirectErrorStream(true);
            Process compileProc = compile.directory(workDir.toFile()).start();
            boolean compiled = compileProc.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!compiled) {
                compileProc.destroyForcibly();
                return TestCaseResultItem.builder()
                        .testCaseId(tc.getId())
                        .testCaseTitle(tc.getTitle())
                        .passed(false)
                        .actualOutput(null)
                        .expectedOutput(tc.getOutput())
                        .timedOut(true)
                        .errorMessage("Compilation timed out")
                        .runtimeMs(System.currentTimeMillis() - start)
                        .build();
            }
            if (compileProc.exitValue() != 0) {
                String err = readStream(compileProc.getInputStream());
                return TestCaseResultItem.builder()
                        .testCaseId(tc.getId())
                        .testCaseTitle(tc.getTitle())
                        .passed(false)
                        .actualOutput(null)
                        .expectedOutput(tc.getOutput())
                        .timedOut(false)
                        .errorMessage("Compilation failed: " + err)
                        .runtimeMs(System.currentTimeMillis() - start)
                        .build();
            }
            String mainClass = mainFile.replaceFirst("\\.java$", "");
            ProcessBuilder run = new ProcessBuilder("java", "-cp", workDir.toString(), mainClass);
            run.redirectErrorStream(true);
            run.directory(workDir.toFile());
            Process process = run.start();
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
            String actual = output.trim();
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
