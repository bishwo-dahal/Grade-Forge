package com.grade.forge.assignment.controller;

import com.grade.forge.assignment.dto.AssignmentBasicResponse;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.service.AssignmentService;
import com.grade.forge.rubric.dto.RubricResponse;
import com.grade.forge.rubric.service.RubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/assignments")
@RequiredArgsConstructor
public class AssignmentStudentController {

    private final AssignmentService assignmentService;
    private final RubricService rubricService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentBasicResponse>> getAssignmentsByCourse(@PathVariable Long courseId) {
        List<AssignmentBasicResponse> assignments = assignmentService.getAssignmentsByCourse(courseId);
        return new ResponseEntity<>(assignments, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}/{assignmentId}")
    public ResponseEntity<AssignmentResponse> getAssignmentByCourse(@PathVariable Long courseId,
                                                                    @PathVariable Long assignmentId) {
        AssignmentResponse assignment = assignmentService.getAssignmentByCourse(courseId, assignmentId);
        return new ResponseEntity<>(assignment, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}/{assignmentId}/rubric")
    public ResponseEntity<RubricResponse> getAssignmentRubricByCourse(@PathVariable Long courseId,
                                                                      @PathVariable Long assignmentId) {
        AssignmentResponse assignment = assignmentService.getAssignmentByCourse(courseId, assignmentId);
        if (assignment.getRubricId() == null) {
            throw new IllegalArgumentException("No rubric is linked to this assignment");
        }
        // NOTE: Student rubric tab requires rubric criteria detail; reuse rubric service response mapping for consistency.
        RubricResponse rubric = rubricService.getRubric(assignment.getRubricId());
        return new ResponseEntity<>(rubric, HttpStatus.OK);
    }


}
