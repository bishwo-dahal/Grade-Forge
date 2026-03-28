package com.grade.forge.courseassistant.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.courseassistant.dto.CourseAssistantRequest;
import com.grade.forge.courseassistant.dto.CourseAssistantResponse;
import com.grade.forge.courseassistant.service.CourseAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<CourseAssistantResponse> assign(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody CourseAssistantRequest request
    ) {
        try {
            CourseAssistantResponse response = courseAssistantService.assignAssistant(request, customUserDetails.getUserId());
            activityLogService.log(authentication, "Assigned course assistant", "Assistant: " + response.getGradingAssistantName() + " to Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Assigned course assistant", "Assignment failed for courseId: " + request.getCourseId(), "failed");
            throw ex;
        }
    }

    @GetMapping
    public ResponseEntity<List<CourseAssistantResponse>> list(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestParam(value = "courseId", required = false) Long courseId
    ) {
        List<CourseAssistantResponse> response = courseAssistantService.listAssistants(courseId, customUserDetails.getUserId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseAssistantResponse> update(
            Authentication authentication,
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody CourseAssistantRequest request
    ) {
        try {
            CourseAssistantResponse response = courseAssistantService.updateAssistant(id, request, customUserDetails.getUserId());
            activityLogService.log(authentication, "Updated course assistant", "Assistant: " + response.getGradingAssistantName() + " for Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated course assistant", "Update failed for assignment ID: " + id, "failed");
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails customUserDetails
    ) {
        CourseAssistantResponse toRemove = courseAssistantService.listAssistants(null, customUserDetails.getUserId()).stream()
                .filter(ca -> ca.getId().equals(id))
                .findFirst()
                .orElse(null);
        try {
            courseAssistantService.removeAssistant(id, customUserDetails.getUserId());
            activityLogService.log(authentication, "Removed course assistant", "Assistant: " + (toRemove != null ? toRemove.getGradingAssistantName() : "") + " from Course: " + (toRemove != null ? toRemove.getCourseName() : ""), "success");
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Removed course assistant", "Removal failed for assignment ID: " + id + " error: " + ex.getMessage(), "failed");
            throw ex;
        }
    }
}

