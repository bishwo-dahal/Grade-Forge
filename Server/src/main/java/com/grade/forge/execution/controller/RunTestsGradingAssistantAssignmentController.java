package com.grade.forge.execution.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.courseassistant.repository.CourseAssistantRepository;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import com.grade.forge.gradingassistant.repository.GradingAssistantRepository;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.service.RunTestsSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Grading assistant: run tests by uploading current editor files. No submission, no S3. */
@RestController
@RequestMapping("/api/v1/grading-assistant/assignments")
@PreAuthorize("hasAuthority('GRADING_ASSISTANT')")
@RequiredArgsConstructor
public class RunTestsGradingAssistantAssignmentController {

    private final RunTestsSyncService runTestsSyncService;
    private final AssignmentRepository assignmentRepository;
    private final GradingAssistantRepository gradingAssistantRepository;
    private final CourseAssistantRepository courseAssistantRepository;
    private final ActivityLogService activityLogService;

    @PostMapping(value = "/{assignmentId}/run-tests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestRunJobStatusResponse> runTestsWithFiles(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails user,
            @org.springframework.web.bind.annotation.PathVariable Long assignmentId,
            @RequestPart("files") List<MultipartFile> files) {
        ensureGradingAssistantCanAccessAssignment(user, assignmentId);
        TestRunJobStatusResponse result = runTestsSyncService.runTests(assignmentId, files, null);
        ResponseEntity<TestRunJobStatusResponse> response = ResponseEntity.ok(result);
        activityLogService.log(authentication, "Requested test run", "Assignment ID: " + assignmentId, "success");
        return response;
    }

    /**
     * Ensure the grading assistant is actually assigned to the course that owns this assignment.
     */
    private void ensureGradingAssistantCanAccessAssignment(CustomUserDetails user, Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new com.grade.forge.exceptionhandler.ResourceNotFoundException(
                        "Assignment not found with id: " + assignmentId));
        GradingAssistant ga = gradingAssistantRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new com.grade.forge.exceptionhandler.ResourceNotFoundException(
                        "Grading assistant not found for user id: " + user.getUserId()));
        boolean allowed = courseAssistantRepository.existsByGradingAssistant_IdAndCourse_Id(
                ga.getId(),
                assignment.getCourse().getId()
        );
        if (!allowed) {
            throw new IllegalArgumentException("You are not allowed to run tests for this assignment.");
        }
    }
}
