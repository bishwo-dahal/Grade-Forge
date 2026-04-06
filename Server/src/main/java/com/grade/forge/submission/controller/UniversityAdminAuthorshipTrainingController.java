package com.grade.forge.submission.controller;

import com.grade.forge.submission.dto.AuthorshipTrainingStartResponse;
import com.grade.forge.submission.dto.AuthorshipTrainingStatusResponse;
import com.grade.forge.submission.service.AuthorshipTrainingJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Triggers on-server authorship triage model training (university admin only). Training runs asynchronously; poll
 * {@code GET .../status/{runId}} for progress.
 */
@RestController
@RequiredArgsConstructor
public class UniversityAdminAuthorshipTrainingController {

    private final AuthorshipTrainingJobService authorshipTrainingJobService;

    @PostMapping("/api/v1/university_admin/run-authorship-training/start")
    public ResponseEntity<AuthorshipTrainingStartResponse> startTraining(Authentication authentication) {
        return authorshipTrainingJobService.start(authentication);
    }

    @GetMapping("/api/v1/university_admin/run-authorship-training/status/{runId}")
    public AuthorshipTrainingStatusResponse trainingStatus(@PathVariable String runId) {
        return authorshipTrainingJobService.getStatus(runId);
    }
}
