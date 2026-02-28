package com.grade.forge.submission.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.submission.dto.SubmissionGradeRequest;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grading-assistant/submissions")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('GRADING_ASSISTANT')")
public class SubmissionGradingAssistantController {

    private final SubmissionService submissionService;

//    Getting the submissions for the grading assistant based on the assignment id
    @GetMapping
    public ResponseEntity<List<SubmissionResponse>> getSubmissionsByAssignment(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                               @RequestParam("assignmentId") Long assignmentId) {
        List<SubmissionResponse> submissions = submissionService.getSubmissionsForGradingAssistantByAssignment(customUserDetails.getUserId(), assignmentId);
        return new ResponseEntity<>(submissions, HttpStatus.OK);
    }


//    For Grading the submission on the assignment
    @PutMapping("/{submissionId}/grade")
    public ResponseEntity<SubmissionResponse> updateGrade(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                          @PathVariable Long submissionId,
                                                          @RequestBody SubmissionGradeRequest request) {
        SubmissionResponse response = submissionService.updateGradeForSubmissionByGradingAssistant(customUserDetails.getUserId(), submissionId, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

