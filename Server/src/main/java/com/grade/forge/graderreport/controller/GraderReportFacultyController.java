package com.grade.forge.graderreport.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.graderreport.dto.GraderReportResponse;
import com.grade.forge.graderreport.service.GraderReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Faculty API: trigger grader report generation and get latest report for an assignment.
 */
@RestController
@RequestMapping("/api/v1/faculty/assignments")
@PreAuthorize("hasAuthority('FACULTY')")
@RequiredArgsConstructor
public class GraderReportFacultyController {

    private final GraderReportService graderReportService;
    private final ActivityLogService activityLogService;

    /**
     * Trigger report generation (manual). Creates a PENDING report and enqueues it.
     * Returns 202 with report id and status; client can poll GET .../grader-report/latest until COMPLETED or FAILED.
     */
    @PostMapping("/{assignmentId}/grader-report")
    public ResponseEntity<GraderReportResponse> requestReport(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long assignmentId) {
        GraderReportResponse response = graderReportService.requestReport(user.getUsername(), assignmentId);
        activityLogService.log(authentication, "Requested grader report", "Assignment ID: " + assignmentId, "success");
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Get the latest grader report for this assignment. Returns 404 if none exists.
     */
    @GetMapping("/{assignmentId}/grader-report/latest")
    public ResponseEntity<GraderReportResponse> getLatestReport(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long assignmentId) {
        GraderReportResponse response = graderReportService.getLatestReport(user.getUsername(), assignmentId);
        return ResponseEntity.ok(response);
    }
}
