package com.grade.forge.submission.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final ActivityLogService activityLogService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubmissionResponse> submitAssignment(Authentication authentication,
                                                               @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                               @RequestParam("assignmentId") Long assignmentId,
                                                               @RequestPart("files") List<MultipartFile> files) {
        SubmissionResponse response = submissionService.submitAssignment(customUserDetails.getUsername(), assignmentId, files);
        activityLogService.log(authentication, "Submitted assignment", "Student: " + response.getStudentName() + " submitted " + response.getAssignmentName(), "success");
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<SubmissionResponse> getSubmission(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                            @PathVariable Long submissionId) {
        SubmissionResponse response = submissionService.getSubmissionForCurrentStudent(customUserDetails.getUsername(), submissionId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/assignment")
    public ResponseEntity<List<SubmissionResponse>> getSubmissionsForAssignment(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                               @RequestParam("assignmentId") Long assignmentId) {
        List<SubmissionResponse> response = submissionService.getSubmissionsForCurrentStudentByAssignment(customUserDetails.getUsername(), assignmentId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
