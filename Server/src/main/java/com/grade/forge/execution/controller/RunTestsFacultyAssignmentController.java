package com.grade.forge.execution.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.service.RunTestsSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Faculty: run tests by uploading current editor files. No submission, no S3. */
@RestController
@RequestMapping("/api/v1/faculty/assignments")
@PreAuthorize("hasAuthority('FACULTY')")
@RequiredArgsConstructor
public class RunTestsFacultyAssignmentController {

    private final RunTestsSyncService runTestsSyncService;
    private final AssignmentRepository assignmentRepository;
    private final FacultyRepository facultyRepository;

    @PostMapping(value = "/{assignmentId}/run-tests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestRunJobStatusResponse> runTestsWithFiles(
            @AuthenticationPrincipal CustomUserDetails user,
            @org.springframework.web.bind.annotation.PathVariable Long assignmentId,
            @RequestPart("files") List<MultipartFile> files) {
        ensureFacultyCanAccessAssignment(user, assignmentId);
        TestRunJobStatusResponse result = runTestsSyncService.runTests(assignmentId, files, null);
        return ResponseEntity.ok(result);
    }

    /**
     * Ensure the authenticated faculty member actually teaches the course that owns this assignment.
     */
    private void ensureFacultyCanAccessAssignment(CustomUserDetails user, Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new com.grade.forge.exceptionhandler.ResourceNotFoundException(
                        "Assignment not found with id: " + assignmentId));
        Faculty faculty = facultyRepository.findByEmail(user.getUsername())
                .orElseThrow(() -> new com.grade.forge.exceptionhandler.ResourceNotFoundException(
                        "Faculty not found with email: " + user.getUsername()));
        if (!assignment.getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to run tests for this assignment.");
        }
    }
}
