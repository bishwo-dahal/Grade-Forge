package com.grade.forge.testsuite.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.testsuite.dto.TestSuiteRequest;
import com.grade.forge.testsuite.dto.TestSuiteResponse;
import com.grade.forge.testsuite.service.TestSuiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/faculty/assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class TestSuiteFacultyController {

    private final TestSuiteService testSuiteService;
    private final AssignmentRepository assignmentRepository;

    @GetMapping("/{assignmentId}/test-suite")
    public ResponseEntity<TestSuiteResponse> getTestSuiteByAssignment(@PathVariable Long assignmentId) {
        assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));
        return testSuiteService.getByAssignmentId(assignmentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/{assignmentId}/test-suite")
    public ResponseEntity<TestSuiteResponse> createTestSuite(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long assignmentId,
            @RequestBody TestSuiteRequest request) {
        TestSuiteResponse response = testSuiteService.create(user.getUsername(), assignmentId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{assignmentId}/test-suite")
    public ResponseEntity<TestSuiteResponse> updateTestSuite(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long assignmentId,
            @RequestBody TestSuiteRequest request) {
        TestSuiteResponse response = testSuiteService.update(user.getUsername(), assignmentId, request);
        return ResponseEntity.ok(response);
    }
}
