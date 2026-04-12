package com.grade.forge.assignment.controller;

import com.grade.forge.assignment.dto.AssignmentBasicResponse;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.service.AssignmentService;
import com.grade.forge.configuration.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grading-assistant/assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('GRADING_ASSISTANT')")
public class AssignmentGradingAssistantController {

    private final AssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<AssignmentBasicResponse>> getMyAssignments(Long courseId) {
        List<AssignmentBasicResponse> assignments = assignmentService.getAssignmentsByCourse(courseId);
        return new ResponseEntity<>(assignments, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}/{assignmentId}")
    public ResponseEntity<AssignmentResponse> getAssignmentById(@PathVariable Long courseId,@PathVariable Long assignmentId
                                                                ) {
        AssignmentResponse assignment = assignmentService.getAssignmentByCourse(courseId,assignmentId);
        return new ResponseEntity<>(assignment, HttpStatus.OK);
    }
}

