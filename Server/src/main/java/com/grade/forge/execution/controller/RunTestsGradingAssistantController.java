package com.grade.forge.execution.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.execution.dto.RunTestsResponse;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.service.TestRunJobService;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/grading-assistant/submissions")
@PreAuthorize("hasAuthority('GRADING_ASSISTANT')")
@RequiredArgsConstructor
public class RunTestsGradingAssistantController {

    private final SubmissionService submissionService;
    private final TestRunJobService testRunJobService;

    @PostMapping("/{submissionId}/run-tests")
    public ResponseEntity<RunTestsResponse> requestRunTests(@AuthenticationPrincipal CustomUserDetails user,
                                                            @PathVariable Long submissionId) {
        submissionService.ensureGradingAssistantCanAccessSubmission(user.getUserId(), submissionId);
        TestRunJob job = testRunJobService.requestRunTests(submissionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(testRunJobService.toRunTestsResponse(job));
    }

    @GetMapping("/{submissionId}/run-tests/latest")
    public ResponseEntity<TestRunJobStatusResponse> getLatestRun(@AuthenticationPrincipal CustomUserDetails user,
                                                                  @PathVariable Long submissionId) {
        submissionService.ensureGradingAssistantCanAccessSubmission(user.getUserId(), submissionId);
        Optional<TestRunJob> job = testRunJobService.getLatestBySubmissionId(submissionId);
        return job
                .map(j -> ResponseEntity.ok(testRunJobService.toStatusResponse(j)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/run-tests/{jobId}")
    public ResponseEntity<TestRunJobStatusResponse> getRunByJobId(@AuthenticationPrincipal CustomUserDetails user,
                                                                   @PathVariable Long jobId) {
        TestRunJob job = testRunJobService.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run job not found with id: " + jobId));
        submissionService.ensureGradingAssistantCanAccessSubmission(user.getUserId(), job.getSubmission().getId());
        return ResponseEntity.ok(testRunJobService.toStatusResponse(job));
    }
}
