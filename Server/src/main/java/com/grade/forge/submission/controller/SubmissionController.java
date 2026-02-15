package com.grade.forge.submission.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.submission.dto.SubmissionRequest;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<SubmissionResponse> submitAssignment(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                               @RequestBody SubmissionRequest request) {
        SubmissionResponse response = submissionService.submitAssignment(customUserDetails.getUsername(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}

