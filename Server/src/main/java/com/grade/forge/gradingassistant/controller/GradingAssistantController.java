package com.grade.forge.gradingassistant.controller;

import com.grade.forge.gradingassistant.dto.GradingAssistantRequest;
import com.grade.forge.gradingassistant.dto.GradingAssistantResponse;
import com.grade.forge.gradingassistant.service.GradingAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/grading-assistants")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class GradingAssistantController {

    private final GradingAssistantService gradingAssistantService;

    @PostMapping
    public ResponseEntity<GradingAssistantResponse> create(@RequestBody GradingAssistantRequest request) {
        GradingAssistantResponse response = gradingAssistantService.createGradingAssistant(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<GradingAssistantResponse>> getAll() {
        List<GradingAssistantResponse> response = gradingAssistantService.getAllGradingAssistants();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GradingAssistantResponse> getOne(@PathVariable Long id) {
        GradingAssistantResponse response = gradingAssistantService.getGradingAssistant(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GradingAssistantResponse> update(@PathVariable Long id, @RequestBody GradingAssistantRequest request) {
        GradingAssistantResponse response = gradingAssistantService.updateGradingAssistant(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gradingAssistantService.deleteGradingAssistant(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}

