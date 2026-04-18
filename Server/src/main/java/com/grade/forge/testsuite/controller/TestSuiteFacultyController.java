package com.grade.forge.testsuite.controller;

import com.grade.forge.audit.service.ActivityLogService;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/faculty/assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('FACULTY','GRADING_ASSISTANT')")
public class TestSuiteFacultyController {

    private final TestSuiteService testSuiteService;
    private final AssignmentRepository assignmentRepository;
    private final ActivityLogService activityLogService;

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
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long assignmentId,
            @RequestBody TestSuiteRequest request) {
        try {
            String assignmentName = assignmentRepository.findById(assignmentId).map(a -> a.getName()).orElse("ID " + assignmentId);
            TestSuiteResponse response = testSuiteService.create(user.getUsername(), assignmentId, request);
            activityLogService.log(authentication, "Created test suite", "Assignment: " + assignmentName, "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created test suite", "Assignment ID: " + assignmentId, "failed");
            throw ex;
        }
    }

    @PutMapping("/{assignmentId}/test-suite")
    public ResponseEntity<TestSuiteResponse> updateTestSuite(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long assignmentId,
            @RequestBody TestSuiteRequest request) {
        try {
            String assignmentName = assignmentRepository.findById(assignmentId).map(a -> a.getName()).orElse("ID " + assignmentId);
            TestSuiteResponse response = testSuiteService.update(user.getUsername(), assignmentId, request);
            activityLogService.log(authentication, "Updated test suite", "Assignment: " + assignmentName, "success");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated test suite", "Assignment ID: " + assignmentId, "failed");
            throw ex;
        }
    }
}
