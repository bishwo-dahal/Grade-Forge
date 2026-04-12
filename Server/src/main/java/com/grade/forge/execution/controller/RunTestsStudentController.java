package com.grade.forge.execution.controller;

import com.grade.forge.audit.ActivityLogService;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/student/submissions")
@PreAuthorize("hasAuthority('STUDENT')")
@RequiredArgsConstructor
public class RunTestsStudentController {

    private final SubmissionService submissionService;
    private final TestRunJobService testRunJobService;
    private final ActivityLogService activityLogService;

    @PostMapping("/{submissionId}/run-tests")
    public ResponseEntity<RunTestsResponse> requestRunTests(Authentication authentication,
                                                            @AuthenticationPrincipal CustomUserDetails user,
                                                            @PathVariable Long submissionId) {
        submissionService.ensureStudentCanAccessSubmission(user.getUsername(), submissionId);
        TestRunJob job = testRunJobService.requestRunTests(submissionId);
        ResponseEntity<RunTestsResponse> response = ResponseEntity.status(HttpStatus.CREATED).body(testRunJobService.toRunTestsResponse(job));
        activityLogService.log(authentication, "Requested test run", "Submission ID: " + submissionId, "success");
        return response;
    }

    @GetMapping("/{submissionId}/run-tests/latest")
    public ResponseEntity<TestRunJobStatusResponse> getLatestRun(Authentication authentication,
                                                                  @AuthenticationPrincipal CustomUserDetails user,
                                                                  @PathVariable Long submissionId) {
        submissionService.ensureStudentCanAccessSubmission(user.getUsername(), submissionId);
        Optional<TestRunJob> job = testRunJobService.getLatestBySubmissionId(submissionId);
        return job
                .map(j -> ResponseEntity.ok(testRunJobService.toStatusResponse(j, false)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/run-tests/{jobId}")
    public ResponseEntity<TestRunJobStatusResponse> getRunByJobId(Authentication authentication,
                                                                   @AuthenticationPrincipal CustomUserDetails user,
                                                                   @PathVariable Long jobId) {
        TestRunJob job = testRunJobService.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Test run job not found with id: " + jobId));
        submissionService.ensureStudentCanAccessSubmission(user.getUsername(), job.getSubmission().getId());
        return ResponseEntity.ok(testRunJobService.toStatusResponse(job, false));
    }
}
