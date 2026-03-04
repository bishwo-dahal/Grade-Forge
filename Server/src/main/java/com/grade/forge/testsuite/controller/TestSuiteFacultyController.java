package com.grade.forge.testsuite.controller;

import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.testsuite.dto.TestSuiteResponse;
import com.grade.forge.testsuite.service.TestSuiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
