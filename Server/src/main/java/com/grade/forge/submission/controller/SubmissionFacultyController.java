package com.grade.forge.submission.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.submission.dto.AuthorshipTriageExportItem;
import com.grade.forge.submission.dto.AuthorshipTriageRequest;
import com.grade.forge.submission.dto.SubmissionGradeRequest;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.dto.SubmissionSummaryResponse;
import com.grade.forge.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/submissions")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class SubmissionFacultyController {

    private final SubmissionService submissionService;
    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<SubmissionSummaryResponse>> getSubmissionsByAssignment(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                                      @RequestParam("assignmentId") Long assignmentId) {
        List<SubmissionSummaryResponse> submissions = submissionService.getSubmissionsForFacultyByAssignment(customUserDetails.getUsername(), assignmentId);
        return new ResponseEntity<>(submissions, HttpStatus.OK);
    }

    @PatchMapping("/{submissionId}/grade")
    public ResponseEntity<SubmissionResponse> updateGrade(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                          @PathVariable Long submissionId,
                                                          @RequestBody SubmissionGradeRequest request) {
        SubmissionResponse response = submissionService.updateGradeForSubmission(customUserDetails.getUsername(), submissionId, request);
        activityLogService.log(authentication, "Graded submission", "Student: " + response.getStudentName() + " scored " + response.getMarks() + " on " + response.getAssignmentName(), "success");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /** Export this instructor's triage labels for an assignment (for offline ML / audit). Must be before /{submissionId}. */
    @GetMapping("/authorship-triage-export")
    public ResponseEntity<List<AuthorshipTriageExportItem>> exportAuthorshipTriage(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestParam("assignmentId") Long assignmentId) {
        List<AuthorshipTriageExportItem> rows = submissionService.exportAuthorshipTriageForAssignment(
                customUserDetails.getUsername(), assignmentId);
        return new ResponseEntity<>(rows, HttpStatus.OK);
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<SubmissionResponse> getSubmission(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                            @PathVariable Long submissionId) {
        SubmissionResponse response = submissionService.getSubmissionForFaculty(customUserDetails.getUsername(), submissionId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * Faculty authorship triage for Plagiarism & AI (training signal + optional grader nudge). Not a misconduct finding.
     * Set label to null to clear.
     */
    @PatchMapping("/{submissionId}/authorship-triage")
    public ResponseEntity<SubmissionResponse> upsertAuthorshipTriage(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @PathVariable Long submissionId,
            @RequestBody AuthorshipTriageRequest request) {
        SubmissionResponse response = submissionService.upsertAuthorshipTriage(customUserDetails.getUsername(), submissionId, request);
        activityLogService.log(authentication, "Authorship triage updated",
                "Submission " + submissionId + " label " + (request.getLabel() != null ? request.getLabel().name() : "cleared"), "success");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
