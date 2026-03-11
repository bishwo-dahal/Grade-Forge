package com.grade.forge.gradingassistant.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.gradingassistant.dto.GradingAssistantRequest;
import com.grade.forge.gradingassistant.dto.GradingAssistantResponse;
import com.grade.forge.gradingassistant.service.GradingAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/grading-assistants")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class GradingAssistantFaultyController {

    private final GradingAssistantService gradingAssistantService;

    @PostMapping
    public ResponseEntity<GradingAssistantResponse> create(@AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody GradingAssistantRequest request) {
        GradingAssistantResponse response = gradingAssistantService.createGradingAssistant(request, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<GradingAssistantResponse>> getAll(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<GradingAssistantResponse> response = gradingAssistantService.getAllGradingAssistants(customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GradingAssistantResponse> getOne(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        GradingAssistantResponse response = gradingAssistantService.getGradingAssistant(id, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GradingAssistantResponse> update(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody GradingAssistantRequest request) {
        GradingAssistantResponse response = gradingAssistantService.updateGradingAssistant(id, request, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        gradingAssistantService.deleteGradingAssistant(id, customUserDetails.getUserId());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
