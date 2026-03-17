package com.grade.forge.grading.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.grading.dto.SubmissionGradeBatchResponse;
import com.grade.forge.grading.service.SubmissionGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/submission-grades")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('STUDENT')")
public class SubmissionGradeStudentController {

    private final SubmissionGradeService submissionGradeService;

    @GetMapping
    public ResponseEntity<SubmissionGradeBatchResponse> getGradesForSubmission(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                               @RequestParam("submissionId") Long submissionId) {
        SubmissionGradeBatchResponse response = submissionGradeService.getGradesForCurrentStudent(customUserDetails.getUsername(), submissionId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionGradeBatchResponse> getGrade(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                 @PathVariable Long id) {
        SubmissionGradeBatchResponse response = submissionGradeService.getGradeForCurrentStudent(customUserDetails.getUsername(), id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

