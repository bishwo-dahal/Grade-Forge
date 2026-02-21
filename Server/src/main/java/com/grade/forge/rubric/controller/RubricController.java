package com.grade.forge.rubric.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.rubric.dto.RubricRequest;
import com.grade.forge.rubric.dto.RubricResponse;
import com.grade.forge.rubric.service.RubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/rubrics")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class RubricController {

    private final RubricService rubricService;

    @PostMapping
    public ResponseEntity<RubricResponse> createRubric(@AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody RubricRequest request) {
        RubricResponse response = rubricService.createRubric(request, customUserDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RubricResponse> updateRubric(@PathVariable Long id, @RequestBody RubricRequest request) {
        RubricResponse response = rubricService.updateRubric(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RubricResponse> getRubric(@PathVariable Long id) {
        RubricResponse response = rubricService.getRubric(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/all")
    public ResponseEntity<List<RubricResponse>> getAllRubrics() {
        List<RubricResponse> responses = rubricService.getAllRubrics();
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRubric(@PathVariable Long id) {
        rubricService.deleteRubric(id);
        return new ResponseEntity<>("Rubric deleted successfully", HttpStatus.OK);
    }

    @GetMapping("/faculty/me")
    public ResponseEntity<RubricResponse> getRubricByFaculty(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        RubricResponse response = rubricService.getRubricByFacultyEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
