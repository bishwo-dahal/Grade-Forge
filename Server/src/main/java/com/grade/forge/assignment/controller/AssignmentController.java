package com.grade.forge.assignment.controller;

import com.grade.forge.assignment.dto.AssignmentBasicResponse;
import com.grade.forge.assignment.dto.AssignmentRequest;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.service.AssignmentService;
import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final ActivityLogService activityLogService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssignmentResponse> createAssignment(Authentication authentication,
                                                               @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                               @RequestPart("assignment") AssignmentRequest request,
                                                               @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        AssignmentResponse created = assignmentService.createAssignment(request, files, customUserDetails.getUsername());
        activityLogService.log(authentication, "Created assignment", "Assignment: " + created.getName() + " in Course: " + created.getCourseName(), "success");
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponse> getAssignment(Authentication authentication, @PathVariable Long id) {
        AssignmentResponse response = assignmentService.getAssignment(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentBasicResponse>> getAssignmentsByCourse(Authentication authentication, @PathVariable Long courseId) {
        List<AssignmentBasicResponse> assignments = assignmentService.getAssignmentsByCourse(courseId);
        return new ResponseEntity<>(assignments, HttpStatus.OK);
    }



    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssignmentResponse> updateAssignment(Authentication authentication,
                                                               @PathVariable Long id,
                                                               @RequestPart("assignment") AssignmentRequest request,
                                                               @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        AssignmentResponse updated = assignmentService.updateAssignment(id, request, files);
        activityLogService.log(authentication, "Updated assignment", "Assignment: " + updated.getName(), "success");
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAssignment(Authentication authentication, @PathVariable Long id) {
        AssignmentResponse existing = assignmentService.getAssignment(id);
        try {
            assignmentService.deleteAssignment(id);
            activityLogService.log(authentication, "Deleted assignment", "Assignment: " + (existing != null ? existing.getName() : ("ID " + id)), "success");
            return new ResponseEntity<>("Assignment deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted assignment", "Assignment: " + (existing != null ? existing.getName() : ("ID " + id)) + " failed: " + ex.getMessage(), "failed");
            throw ex;
        }
    }
}
