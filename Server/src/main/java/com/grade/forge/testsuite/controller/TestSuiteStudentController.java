package com.grade.forge.testsuite.controller;

import com.grade.forge.assignment.service.AssignmentService;
import com.grade.forge.testsuite.dto.TestSuiteResponse;
import com.grade.forge.testsuite.service.TestSuiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/assignments")
@RequiredArgsConstructor
public class TestSuiteStudentController {

    private final TestSuiteService testSuiteService;
    private final AssignmentService assignmentService;

    @GetMapping("/course/{courseId}/{assignmentId}/test-suite")
    public ResponseEntity<TestSuiteResponse> getTestSuiteByCourseAndAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId) {
        assignmentService.getAssignmentByCourse(courseId, assignmentId);
        return testSuiteService.getByAssignmentId(assignmentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
