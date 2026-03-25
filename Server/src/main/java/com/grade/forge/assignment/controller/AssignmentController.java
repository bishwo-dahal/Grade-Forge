package com.grade.forge.assignment.controller;

import com.grade.forge.assignment.dto.AssignmentBasicResponse;
import com.grade.forge.assignment.dto.AssignmentRequest;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.service.AssignmentService;
import com.grade.forge.configuration.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssignmentResponse> createAssignment(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                               @RequestPart("assignment") AssignmentRequest request,
                                                               @RequestPart(value = "starterFiles", required = false) List<MultipartFile> starterFiles) {
        AssignmentResponse created = assignmentService.createAssignment(request, starterFiles, customUserDetails.getUsername());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponse> getAssignment(@PathVariable Long id) {
        AssignmentResponse response = assignmentService.getAssignment(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentBasicResponse>> getAssignmentsByCourse(@PathVariable Long courseId) {
        List<AssignmentBasicResponse> assignments = assignmentService.getAssignmentsByCourse(courseId);
        return new ResponseEntity<>(assignments, HttpStatus.OK);
    }



    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssignmentResponse> updateAssignment(@PathVariable Long id,
                                                               @RequestPart("assignment") AssignmentRequest request,
                                                               @RequestPart(value = "starterFiles", required = false) List<MultipartFile> starterFiles,
                                                               @RequestPart(value = "retainStarterFileIds", required = false) List<Long> retainStarterFileIds) {
        AssignmentResponse updated = assignmentService.updateAssignment(id, request, starterFiles, retainStarterFileIds);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return new ResponseEntity<>("Assignment deleted successfully", HttpStatus.OK);
    }
}
