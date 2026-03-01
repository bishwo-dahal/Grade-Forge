package com.grade.forge.courseassistant.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.courseassistant.dto.CourseAssistantRequest;
import com.grade.forge.courseassistant.dto.CourseAssistantResponse;
import com.grade.forge.courseassistant.service.CourseAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;


// Faculty can manage grading assistants for their courses. They can assign a grading assistant to a course, view all assistants assigned to their courses, update assistant assignments, and remove assistants from courses.
@RestController
@RequestMapping("/api/v1/faculty/course-assistants")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class CourseAssistantController {

    private final CourseAssistantService courseAssistantService;

    @PostMapping
    public ResponseEntity<CourseAssistantResponse> assign(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody CourseAssistantRequest request
    ) {
        CourseAssistantResponse response = courseAssistantService.assignAssistant(request, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CourseAssistantResponse>> list(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestParam(value = "courseId", required = false) Long courseId
    ) {
        List<CourseAssistantResponse> response = courseAssistantService.listAssistants(courseId, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseAssistantResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody CourseAssistantRequest request
    ) {
        CourseAssistantResponse response = courseAssistantService.updateAssistant(id, request, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        courseAssistantService.removeAssistant(id, customUserDetails.getUserId());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}

