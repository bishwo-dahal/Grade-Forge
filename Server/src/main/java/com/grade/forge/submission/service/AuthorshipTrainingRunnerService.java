package com.grade.forge.submission.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grade.forge.graderreport.entity.GraderReport;
import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.repository.GraderReportRepository;
import com.grade.forge.submission.dto.AuthorshipTrainingRunResponse;
import com.grade.forge.submission.dto.AuthorshipTriageUniversityAdminItem;
import com.grade.forge.submission.repository.SubmissionAuthorshipTriageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/**
 * Builds label + grader-derived feature tables and runs {@code ml_training/train_authorship.py} on the server.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthorshipTrainingRunnerService {

    private static final int MIN_TRAINING_ROWS = 10;
    private static final int STDERR_TAIL_MAX = 4000;

    private final SubmissionAuthorshipTriageRepository submissionAuthorshipTriageRepository;
    private final GraderReportRepository graderReportRepository;
    private final ObjectMapper objectMapper;

    @Value("${grader.python-cmd:python3}")
    private String pythonCommand;

    @Value("${ml.training.dir:../ml_training}")
    private String mlTrainingDir;

    @Value("${ml.authorship-model.path:}")
    private String authorshipModelPath;

    public AuthorshipTrainingRunResponse runTraining() {
        return runTraining(null);
    }

    /**
     * @param onPhase invoked on the calling thread during feature build; during the Python subprocess from a ticker thread as well.
     */
    public AuthorshipTrainingRunResponse runTraining(Consumer<String> onPhase) {
        Consumer<String> phase = onPhase != null ? onPhase : (s -> {});

        if (authorshipModelPath == null || authorshipModelPath.isBlank()) {
            return fail("Model path is empty. Unset ML_AUTHORSHIP_MODEL_PATH or set ml.authorship-model.path to a writable file.", 0, 0, 0, null);
        }

        Path outPath = Paths.get(authorshipModelPath.trim()).toAbsolutePath().normalize();
        Path mlDir = Paths.get(mlTrainingDir.trim()).toAbsolutePath().normalize();
        Path trainScript = mlDir.resolve("train_authorship.py");
        if (!Files.isRegularFile(trainScript)) {
            return fail("train_authorship.py not found at " + trainScript + ". Set ml.training.dir (or ML_TRAINING_DIR).", 0, 0, 0, null);
        }

        phase.accept("Loading triage labels…");
        List<AuthorshipTriageUniversityAdminItem> all = submissionAuthorshipTriageRepository.findAllTrainingRowsForUniversityAdmin();
        if (all.isEmpty()) {
            return fail("No authorship triage labels in the database yet.", 0, 0, 0, null);
        }

        Map<Long, Map<String, Map<String, Double>>> featuresByAssignment = new ConcurrentHashMap<>();

        List<Map<String, Object>> trainingLabels = new ArrayList<>();
        Map<String, Map<String, Double>> featuresBySubmission = new LinkedHashMap<>();
        int skipped = 0;

        int allSize = all.size();
        int progressStep = Math.max(1, allSize / 20);
        int rowIndex = 0;
        for (AuthorshipTriageUniversityAdminItem row : all) {
            rowIndex++;
            if (rowIndex % progressStep == 0 || rowIndex == allSize) {
                phase.accept("Joining labels with grader reports… (" + rowIndex + " / " + allSize + " rows)");
            }
            Map<String, Map<String, Double>> byStudent = featuresByAssignment.computeIfAbsent(
                    row.getAssignmentId(), aid -> loadFeaturesByStudentForAssignment(aid));
            String studentKey = String.valueOf(row.getStudentId());
            Map<String, Double> feats = byStudent.get(studentKey);
            if (feats == null || feats.isEmpty()) {
                skipped++;
                continue;
            }
            String subKey = String.valueOf(row.getSubmissionId());
            featuresBySubmission.put(subKey, feats);
            trainingLabels.add(Map.of(
                    "submissionId", row.getSubmissionId(),
                    "label", row.getLabel().name()
            ));
        }

        if (trainingLabels.size() < MIN_TRAINING_ROWS) {
            return fail(
                    "Need at least " + MIN_TRAINING_ROWS + " labeled submissions with a completed Plagiarism & AI report for the same assignment (have "
                            + trainingLabels.size() + "). Run reports first, then label more submissions.",
                    all.size(),
                    trainingLabels.size(),
                    skipped,
                    null
            );
        }

        Path workDir = null;
        try {
            phase.accept("Writing training files…");
            workDir = Files.createTempDirectory("authorship-train-");
            Path labelsFile = workDir.resolve("labels.json");
            Path featuresFile = workDir.resolve("features.json");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(labelsFile.toFile(), trainingLabels);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(featuresFile.toFile(), featuresBySubmission);

            Path parent = outPath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }

            ProcessBuilder pb = new ProcessBuilder(
                    pythonCommand,
                    trainScript.toString(),
                    "--labels", labelsFile.toAbsolutePath().toString(),
                    "--features", featuresFile.toAbsolutePath().toString(),
                    "--out", outPath.toString()
            );
            pb.directory(mlDir.toFile());
            pb.redirectErrorStream(false);
            Map<String, String> env = pb.environment();
            env.put("PYTHONUTF8", "1");

            phase.accept("Starting Python training…");
            Process process = pb.start();
            StringBuilder stdoutBuf = new StringBuilder();
            StringBuilder stderrBuf = new StringBuilder();
            AtomicReference<String> lastStdoutLine = new AtomicReference<>("");

            Thread outThread = new Thread(() -> drainLines(process.getInputStream(), stdoutBuf, lastStdoutLine), "authorship-train-out");
            Thread errThread = new Thread(() -> drainLines(process.getErrorStream(), stderrBuf, null), "authorship-train-err");
            outThread.setDaemon(true);
            errThread.setDaemon(true);
            outThread.start();
            errThread.start();

            ScheduledExecutorService ticker = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "authorship-train-tick");
                t.setDaemon(true);
                return t;
            });
            ticker.scheduleAtFixedRate(
                    () -> {
                        String l = lastStdoutLine.get();
                        if (l != null && !l.isBlank()) {
                            String t = l.length() > 160 ? l.substring(0, 157) + "…" : l;
                            phase.accept("Training: " + t);
                        } else {
                            phase.accept("Running Python training…");
                        }
                    },
                    1,
                    1,
                    TimeUnit.SECONDS);

            boolean finished;
            try {
                finished = process.waitFor(20, TimeUnit.MINUTES);
            } finally {
                ticker.shutdown();
                try {
                    ticker.awaitTermination(2, TimeUnit.SECONDS);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }

            outThread.join(5000);
            errThread.join(5000);

            String stdout = stdoutBuf.toString();
            String stderr = stderrBuf.toString();
            if (!finished) {
                process.destroyForcibly();
                return fail("Training timed out after 20 minutes.", all.size(), trainingLabels.size(), skipped, tail(stderr));
            }
            int exit = process.exitValue();
            if (exit != 0) {
                log.warn("train_authorship.py exited {} stdout={} stderr={}", exit, stdout, stderr);
                return fail("Training script failed (exit " + exit + "). Install Python deps on the server: pip install -r ml_training/requirements-train.txt",
                        all.size(), trainingLabels.size(), skipped, tail(stderr + "\n" + stdout));
            }

            if (!Files.isRegularFile(outPath)) {
                return fail("Training finished but model file was not written to " + outPath, all.size(), trainingLabels.size(), skipped, tail(stderr));
            }

            phase.accept("Saving model…");
            return AuthorshipTrainingRunResponse.builder()
                    .success(true)
                    .message("Trained model saved to " + outPath + " using " + trainingLabels.size() + " labeled rows.")
                    .labeledRowsTotal(all.size())
                    .rowsUsedForTraining(trainingLabels.size())
                    .rowsSkippedNoGraderFeatures(skipped)
                    .modelOutputPath(outPath.toString())
                    .stderrTail(null)
                    .build();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Authorship training failed", e);
            return fail(e.getMessage() != null ? e.getMessage() : "Training failed", all.size(), trainingLabels.size(), skipped, null);
        } finally {
            if (workDir != null) {
                deleteRecursively(workDir);
            }
        }
    }

    private static void drainLines(InputStream in, StringBuilder full, AtomicReference<String> lastLine) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                full.append(line).append('\n');
                if (lastLine != null && !line.isBlank()) {
                    lastLine.set(line.trim());
                }
            }
        } catch (IOException ignored) {
            // Process may have been destroyed
        }
    }

    private Map<String, Map<String, Double>> loadFeaturesByStudentForAssignment(Long assignmentId) {
        Optional<GraderReport> opt = graderReportRepository.findFirstByAssignment_IdAndStatusOrderByGeneratedAtDesc(
                assignmentId, GraderReportStatus.COMPLETED);
        if (opt.isEmpty()) {
            return Map.of();
        }
        GraderReport report = opt.get();
        if (report.getResultJson() == null || report.getResultJson().isBlank()) {
            return Map.of();
        }
        try {
            JsonNode root = objectMapper.readTree(report.getResultJson());
            JsonNode results = root.get("results");
            if (results == null || !results.isArray()) {
                return Map.of();
            }
            Map<String, Map<String, Double>> byStudent = new LinkedHashMap<>();
            for (JsonNode r : results) {
                String sid = textOrNull(r.get("student_id"));
                if (sid == null) {
                    continue;
                }
                Map<String, Double> m = new LinkedHashMap<>();
                m.put("similarity_score", r.path("similarity_score").asDouble(0.0));
                JsonNode ai = r.path("ai_features");
                m.put("risk_score", ai.path("risk_score").asDouble(0.0));
                JsonNode metrics = ai.path("metrics");
                m.put("code_lines", metrics.path("code_lines").asDouble(0.0));
                m.put("comment_ratio", metrics.path("comment_ratio").asDouble(0.0));
                m.put("long_identifier_ratio", metrics.path("long_identifier_ratio").asDouble(0.0));
                m.put("marker_hits", metrics.path("marker_hits").asDouble(0.0));
                m.put("avg_line_length", metrics.path("avg_line_length").asDouble(0.0));
                m.put("line_length_std", metrics.path("line_length_std").asDouble(0.0));
                JsonNode llm = ai.path("llm_signal");
                m.put("llm_ai_likeness", llm.path("ai_likeness").asDouble(0.0));
                m.put("llm_uncertainty", llm.path("uncertainty").asDouble(0.0));
                byStudent.put(sid, m);
            }
            return byStudent;
        } catch (IOException e) {
            log.debug("Could not parse grader report for assignment {}", assignmentId, e);
            return Map.of();
        }
    }

    private static AuthorshipTrainingRunResponse fail(String message, int total, int used, int skipped, String stderrTail) {
        return AuthorshipTrainingRunResponse.builder()
                .success(false)
                .message(message)
                .labeledRowsTotal(total)
                .rowsUsedForTraining(used)
                .rowsSkippedNoGraderFeatures(skipped)
                .modelOutputPath(null)
                .stderrTail(stderrTail)
                .build();
    }

    private static String tail(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String t = s.trim();
        if (t.length() <= STDERR_TAIL_MAX) {
            return t;
        }
        return t.substring(t.length() - STDERR_TAIL_MAX);
    }

    private static String textOrNull(JsonNode n) {
        if (n == null || n.isNull() || n.isMissingNode()) {
            return null;
        }
        String t = n.asText();
        return t.isBlank() ? null : t;
    }

    private static void deleteRecursively(Path path) {
        try {
            if (Files.isDirectory(path)) {
                try (var stream = Files.list(path)) {
                    stream.forEach(AuthorshipTrainingRunnerService::deleteRecursively);
                }
            }
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.debug("Could not delete {}", path, e);
        }
    }
}
