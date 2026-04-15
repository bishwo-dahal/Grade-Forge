package com.grade.forge.canvas.controller;

import com.grade.forge.canvas.service.CanvasAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faculty/canvas")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class AssignmentCanvasController {

    private final CanvasAssignmentService canvasAssignmentService;

    @PostMapping("/{courseId}/{assignmentId}/publish")
    public String publishAssignmentToCanvas(@PathVariable Long courseId, @PathVariable Long assignmentId) {

        canvasAssignmentService.publishAssignment(courseId, assignmentId);
        return "success";
    }





}
