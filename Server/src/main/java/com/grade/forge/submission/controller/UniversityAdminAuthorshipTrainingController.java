package com.grade.forge.submission.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.submission.dto.AuthorshipTrainingRunResponse;
import com.grade.forge.submission.service.AuthorshipTrainingRunnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Triggers on-server authorship triage model training (university admin only).
 */
@RestController
@RequiredArgsConstructor
public class UniversityAdminAuthorshipTrainingController {

    private final AuthorshipTrainingRunnerService authorshipTrainingRunnerService;
    private final ActivityLogService activityLogService;

    @PostMapping("/api/v1/university_admin/run-authorship-training")
    public ResponseEntity<AuthorshipTrainingRunResponse> runTraining(Authentication authentication) {
        AuthorshipTrainingRunResponse result = authorshipTrainingRunnerService.runTraining();
        if (result.isSuccess()) {
            activityLogService.log(authentication, "Authorship ML model trained", result.getMessage(), "success");
            return ResponseEntity.ok(result);
        }
        HttpStatus status = result.getStderrTail() != null ? HttpStatus.INTERNAL_SERVER_ERROR : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(result);
    }
}
