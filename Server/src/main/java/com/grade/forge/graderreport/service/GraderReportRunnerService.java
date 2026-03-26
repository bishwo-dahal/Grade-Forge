package com.grade.forge.graderreport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.graderreport.entity.GraderReport;
import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.repository.GraderReportRepository;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionFile;
import com.grade.forge.submission.repository.SubmissionFileRepository;
import com.grade.forge.submission.repository.SubmissionRepository;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.entity.TestCaseResult;
import com.grade.forge.execution.repository.TestCaseResultRepository;
import com.grade.forge.execution.repository.TestRunJobRepository;
import com.grade.forge.testsuite.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/**
 * Runs the grader pipeline for a {@link GraderReport}: downloads submission files to a temp dir,
 * builds grader input JSON, invokes the Python script, parses output, and updates the report.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GraderReportRunnerService {

    private static final String INPUT_FILENAME = "input.json";
    private static final double DEFAULT_PUBLIC_WEIGHT = 0.4;
    private static final double DEFAULT_PRIVATE_WEIGHT = 0.6;

    @Value("${grader.dir:grader}")
    private String graderDir;

    @Value("${grader.work-dir:${java.io.tmpdir}}")
    private String workDirBase;

    @Value("${grader.python-cmd:python3}")
    private String pythonCommand;

    // Optional LLM-assisted AI evidence signals for grader AI authorship triage.
    // Passed to the Python grader as environment variables so the grader can read via os.environ.
    @Value("${grader.llm.ai-signal.enabled:true}")
    private boolean llmAiSignalEnabled;

    @Value("${grader.llm.ai-signal.url:http://localhost:11434/api/generate}")
    private String llmAiSignalUrl;

    @Value("${grader.llm.ai-signal.model:llama3}")
    private String llmAiSignalModel;

    @Value("${grader.llm.ai-signal.timeout-sec:30}")
    private int llmAiSignalTimeoutSec;

    @Value("${grader.llm.ai-signal.max-files:5}")
    private int llmAiSignalMaxFiles;

    @Value("${grader.llm.ai-signal.max-students:0}")
    private int llmAiSignalMaxStudents;

    @Value("${grader.llm.ai-signal.max-chars-total:9000}")
    private int llmAiSignalMaxCharsTotal;

    @Value("${grader.llm.ai-signal.max-chars-per-file:2500}")
    private int llmAiSignalMaxCharsPerFile;

    @Value("${grader.llm.ai-signal.min-likeliness:0.45}")
    private double llmAiSignalMinLikeliness;

    @Value("${grader.llm.ai-signal.weight:0.12}")
    private double llmAiSignalWeight;

    private final GraderReportRepository graderReportRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final FileStorageService fileStorageService;
    private final TestRunJobRepository testRunJobRepository;
    private final TestCaseResultRepository testCaseResultRepository;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Run the grader pipeline for the given report. Loads the assignment, writes submission files
     * to a temp dir, invokes the Python grader, and updates the report with result_json (COMPLETED)
     * or error_message (FAILED). Temp dir is deleted when done.
     */
    @Transactional
    public void run(GraderReport report) {
        Long reportId = report.getId();
        if (report.getStatus() != GraderReportStatus.PENDING) {
            log.debug("GraderReport {} not PENDING, skipping", reportId);
            return;
        }

        report.setStatus(GraderReportStatus.RUNNING);
        graderReportRepository.save(report);

        Path workDir = null;
        try {
            Assignment assignment = assignmentRepository.findById(report.getAssignment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + report.getAssignment().getId()));

            List<Submission> submissions = submissionRepository.findByAssignment_Id(assignment.getId());
            if (submissions.isEmpty()) {
                String emptyResult = buildEmptyResultJson(assignment.getId().toString());
                report.setResultJson(emptyResult);
                report.setStatus(GraderReportStatus.COMPLETED);
                report.setErrorMessage(null);
                graderReportRepository.save(report);
                log.info("GraderReport {} completed with no submissions", reportId);
                return;
            }

            workDir = createWorkDir(reportId);
            writeSubmissionFiles(workDir, submissions);
            Map<String, Object> inputJson = buildGraderInput(assignment, submissions, workDir);
            Path inputPath = workDir.resolve(INPUT_FILENAME);
            Files.writeString(inputPath, objectMapper.writeValueAsString(inputJson), StandardCharsets.UTF_8);

            String resultJson = invokeGrader(inputPath.toAbsolutePath().toString());
            report.setResultJson(resultJson);
            report.setStatus(GraderReportStatus.COMPLETED);
            report.setErrorMessage(null);
            graderReportRepository.save(report);
            log.info("GraderReport {} completed successfully", reportId);
        } catch (Exception e) {
            log.warn("GraderReport {} failed", reportId, e);
            report.setStatus(GraderReportStatus.FAILED);
            report.setErrorMessage(e.getMessage() != null ? e.getMessage() : "Grader pipeline failed");
            graderReportRepository.save(report);
        } finally {
            if (workDir != null && Files.exists(workDir)) {
                deleteRecursively(workDir);
            }
        }
    }

    private String buildEmptyResultJson(String assignmentId) {
        Map<String, Object> empty = new LinkedHashMap<>();
        empty.put("assignment_id", assignmentId);
        empty.put("results", List.of());
        empty.put("highlight_markers", Map.of("start", ">>", "end", "<<"));
        empty.put("ai_features", Map.of());
        try {
            return objectMapper.writeValueAsString(empty);
        } catch (Exception e) {
            return "{\"assignment_id\":\"" + assignmentId + "\",\"results\":[],\"highlight_markers\":{\"start\":\">>\",\"end\":\"<<\"},\"ai_features\":{}}";
        }
    }

    private Path createWorkDir(Long reportId) throws IOException {
        Path base = Path.of(workDirBase).toAbsolutePath().normalize();
        Files.createDirectories(base);
        return Files.createTempDirectory(base, "grader-report-" + reportId + "-");
    }

    private void writeSubmissionFiles(Path workDir, List<Submission> submissions) throws IOException {
        Path submissionsDir = workDir.resolve("submissions");
        Files.createDirectories(submissionsDir);

        for (Submission submission : submissions) {
            String studentId = submission.getStudent().getId().toString();
            Path studentDir = submissionsDir.resolve("student_" + studentId);
            Files.createDirectories(studentDir);

            List<SubmissionFile> files = submissionFileRepository.findBySubmission_IdOrderById(submission.getId());
            for (SubmissionFile file : files) {
                byte[] content = fileStorageService.getFileContent(file.getFileKey());
                Path dest = studentDir.resolve(sanitizeFileName(file.getFileName()));
                Files.write(dest, content);
            }
        }
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "file";
        String n = name.replace("\\", "/");
        int last = n.lastIndexOf('/');
        if (last >= 0 && last + 1 < n.length()) n = n.substring(last + 1);
        return n.replaceAll("\\.\\.", "");
    }

    private Map<String, Object> buildGraderInput(Assignment assignment, List<Submission> submissions, Path workDir) {
        int publicTests = 1;
        int privateTests = 1;
        List<TestCase> testCases = Collections.emptyList();
        if (assignment.getTestSuite() != null) {
            testCases = testCaseRepository.findByTestSuite_Id(assignment.getTestSuite().getId());
            long pub = testCases.stream().filter(tc -> !Boolean.TRUE.equals(tc.getIsPrivate())).count();
            long priv = testCases.stream().filter(tc -> Boolean.TRUE.equals(tc.getIsPrivate())).count();
            publicTests = (int) Math.max(1, pub);
            privateTests = (int) Math.max(1, priv);
        }

        String language = "python";
        if (assignment.getProgrammingLanguage() != null && assignment.getProgrammingLanguage().getName() != null) {
            language = assignment.getProgrammingLanguage().getName().toLowerCase(Locale.ROOT);
        }

        Map<String, Double> weights = Map.of("public", DEFAULT_PUBLIC_WEIGHT, "private", DEFAULT_PRIVATE_WEIGHT);

        List<Map<String, Object>> submissionEntries = new ArrayList<>();
        Path submissionsDir = workDir.resolve("submissions");

        for (Submission submission : submissions) {
            String studentId = submission.getStudent().getId().toString();
            List<SubmissionFile> files = submissionFileRepository.findBySubmission_IdOrderById(submission.getId());
            List<String> filePaths = new ArrayList<>();
            Path studentDir = submissionsDir.resolve("student_" + studentId);
            for (SubmissionFile f : files) {
                filePaths.add(studentDir.resolve(sanitizeFileName(f.getFileName())).toAbsolutePath().toString());
            }

            int publicPass = 0;
            int privatePass = 0;
            List<TestRunJob> jobs = testRunJobRepository.findBySubmission_IdOrderByCreatedAtDesc(submission.getId());
            if (!jobs.isEmpty()) {
                TestRunJob latest = jobs.get(0);
                List<TestCaseResult> results = testCaseResultRepository.findByTestRunJob_IdOrderById(latest.getId());
                for (TestCaseResult tr : results) {
                    if (Boolean.TRUE.equals(tr.getPassed())) {
                        if (Boolean.TRUE.equals(tr.getTestCase().getIsPrivate()))
                            privatePass++;
                        else
                            publicPass++;
                    }
                }
            }

            Map<String, Object> sub = new LinkedHashMap<>();
            sub.put("student_id", studentId);
            sub.put("student_name", submission.getStudent() != null && submission.getStudent().getUser() != null
                    ? submission.getStudent().getUser().getName()
                    : null);
            if (filePaths.size() == 1) {
                sub.put("file_path", filePaths.get(0));
            } else {
                sub.put("file_paths", filePaths);
            }
            sub.put("test_results", Map.of("public_pass", publicPass, "private_pass", privatePass));
            submissionEntries.add(sub);
        }

        Map<String, Object> input = new LinkedHashMap<>();
        input.put("assignment_id", assignment.getId().toString());
        input.put("public_tests", publicTests);
        input.put("private_tests", privateTests);
        input.put("language", language);
        input.put("weights", weights);
        input.put("submissions", submissionEntries);
        return input;
    }

    private String invokeGrader(String inputPath) throws IOException, InterruptedException {
        Path graderPath = Path.of(graderDir).toAbsolutePath().normalize();
        if (!Files.isDirectory(graderPath)) {
            throw new IOException("Grader directory not found: " + graderPath);
        }
        Path runPy = graderPath.resolve("run.py");
        if (!Files.isRegularFile(runPy)) {
            throw new IOException("Grader run.py not found: " + runPy);
        }

        ProcessBuilder pb = new ProcessBuilder(pythonCommand, runPy.toString(), inputPath);
        pb.directory(graderPath.toFile());
        // Ensure optional LLM AI signals are available in the grader process environment.
        Map<String, String> env = pb.environment();
        env.put("GRADER_LLM_AI_SIGNAL_ENABLED", Boolean.toString(llmAiSignalEnabled));
        env.put("GRADER_LLM_AI_SIGNAL_URL", llmAiSignalUrl);
        env.put("GRADER_LLM_AI_SIGNAL_MODEL", llmAiSignalModel);
        env.put("GRADER_LLM_AI_SIGNAL_TIMEOUT_SEC", Integer.toString(llmAiSignalTimeoutSec));
        env.put("GRADER_LLM_AI_SIGNAL_MAX_FILES", Integer.toString(llmAiSignalMaxFiles));
        env.put("GRADER_LLM_AI_SIGNAL_MAX_STUDENTS", Integer.toString(llmAiSignalMaxStudents));
        env.put("GRADER_LLM_AI_SIGNAL_MAX_CHARS_TOTAL", Integer.toString(llmAiSignalMaxCharsTotal));
        env.put("GRADER_LLM_AI_SIGNAL_MAX_CHARS_PER_FILE", Integer.toString(llmAiSignalMaxCharsPerFile));
        env.put("GRADER_LLM_AI_SIGNAL_MIN_LIKELINESS", Double.toString(llmAiSignalMinLikeliness));
        env.put("GRADER_LLM_AI_SIGNAL_WEIGHT", Double.toString(llmAiSignalWeight));
        pb.redirectErrorStream(false);
        Process process = pb.start();

        String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        int exit = process.waitFor();

        if (exit != 0) {
            throw new IOException("Grader exited with " + exit + (stderr.isBlank() ? "" : ": " + stderr.trim()));
        }

        try {
            objectMapper.readTree(stdout);
        } catch (Exception e) {
            throw new IOException("Grader output is not valid JSON: " + e.getMessage());
        }
        return stdout.trim();
    }

    private static void deleteRecursively(Path path) {
        try {
            if (Files.isDirectory(path)) {
                try (var stream = Files.list(path)) {
                    stream.forEach(GraderReportRunnerService::deleteRecursively);
                }
            }
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.debug("Could not delete {}", path, e);
        }
    }
}
