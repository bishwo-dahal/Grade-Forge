package com.grade.forge.submission.service;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.submission.dto.AuthorshipTrainingRunResponse;
import com.grade.forge.submission.dto.AuthorshipTrainingStartResponse;
import com.grade.forge.submission.dto.AuthorshipTrainingStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Runs authorship training asynchronously so clients can poll {@link #getStatus(String)} for progress.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthorshipTrainingJobService {

    private final AuthorshipTrainingRunnerService authorshipTrainingRunnerService;
    private final ActivityLogService activityLogService;

    private final AtomicBoolean runInProgress = new AtomicBoolean(false);
    private final Map<String, JobRecord> jobs = new ConcurrentHashMap<>();

    public ResponseEntity<AuthorshipTrainingStartResponse> start(Authentication authentication) {
        if (!runInProgress.compareAndSet(false, true)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Training is already in progress.");
        }
        jobs.entrySet().removeIf(e -> e.getValue().isTerminal());
        String runId = UUID.randomUUID().toString();
        JobRecord job = new JobRecord(runId);
        jobs.put(runId, job);

        CompletableFuture.runAsync(() -> {
            try {
                AuthorshipTrainingRunResponse result =
                        authorshipTrainingRunnerService.runTraining(job::setPhase);
                job.complete(result);
                if (result.isSuccess()) {
                    activityLogService.log(
                            authentication,
                            "Authorship ML model trained",
                            result.getMessage(),
                            "success");
                }
            } catch (Exception e) {
                log.warn("Authorship training job failed", e);
                job.complete(
                        AuthorshipTrainingRunResponse.builder()
                                .success(false)
                                .message(e.getMessage() != null ? e.getMessage() : "Training failed")
                                .labeledRowsTotal(0)
                                .rowsUsedForTraining(0)
                                .rowsSkippedNoGraderFeatures(0)
                                .modelOutputPath(null)
                                .stderrTail(null)
                                .build());
            } finally {
                runInProgress.set(false);
            }
        });

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(AuthorshipTrainingStartResponse.builder().runId(runId).build());
    }

    public AuthorshipTrainingStatusResponse getStatus(String runId) {
        JobRecord job = jobs.get(runId);
        if (job == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown training run.");
        }
        return job.toResponse();
    }

    private static final class JobRecord {
        private final String runId;
        private volatile String phase = "Starting…";
        private volatile AuthorshipTrainingRunResponse result;
        private volatile boolean terminal;

        JobRecord(String runId) {
            this.runId = runId;
        }

        boolean isTerminal() {
            return terminal;
        }

        void setPhase(String p) {
            if (p != null && !p.isBlank()) {
                this.phase = p;
            }
        }

        void complete(AuthorshipTrainingRunResponse r) {
            this.result = r;
            this.phase = r.isSuccess() ? "Finished." : "Training failed.";
            this.terminal = true;
        }

        AuthorshipTrainingStatusResponse toResponse() {
            AuthorshipTrainingRunResponse r = result;
            if (r == null) {
                return AuthorshipTrainingStatusResponse.builder()
                        .runId(runId)
                        .state(AuthorshipTrainingStatusResponse.State.RUNNING)
                        .phase(phase)
                        .build();
            }
            return AuthorshipTrainingStatusResponse.builder()
                    .runId(runId)
                    .state(r.isSuccess()
                            ? AuthorshipTrainingStatusResponse.State.SUCCEEDED
                            : AuthorshipTrainingStatusResponse.State.FAILED)
                    .phase(phase)
                    .success(r.isSuccess())
                    .message(r.getMessage())
                    .labeledRowsTotal(r.getLabeledRowsTotal())
                    .rowsUsedForTraining(r.getRowsUsedForTraining())
                    .rowsSkippedNoGraderFeatures(r.getRowsSkippedNoGraderFeatures())
                    .modelOutputPath(r.getModelOutputPath())
                    .stderrTail(r.getStderrTail())
                    .build();
        }
    }
}
