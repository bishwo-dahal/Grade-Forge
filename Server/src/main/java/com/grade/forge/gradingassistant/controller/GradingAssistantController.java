package com.grade.forge.gradingassistant.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.gradingassistant.dto.GradingAssistantResponse;
import com.grade.forge.gradingassistant.service.GradingAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/grading-assistants")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('GRADING_ASSISTANT')")
public class GradingAssistantController {

    private final GradingAssistantService gradingAssistantService;

    @GetMapping("/me")
    public ResponseEntity<GradingAssistantResponse> getMyProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        GradingAssistantResponse response = gradingAssistantService.getCurrentGradingAssistant(customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
