package com.grade.forge.grading.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.grading.dto.SubmissionGradeBatchRequest;
import com.grade.forge.grading.dto.SubmissionGradeBatchResponse;
import com.grade.forge.grading.service.SubmissionGradeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/grading-assistant/submission-grades")
@RequiredArgsConstructor
public class SubmissionGradeGradingAssistantController {

    private final SubmissionGradeService submissionGradeService;
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<SubmissionGradeBatchResponse> create(Authentication authentication, @RequestBody SubmissionGradeBatchRequest request) {
        try {
            SubmissionGradeBatchResponse created = submissionGradeService.createGrades(request);
            activityLogService.log(authentication, "Created submission grades", "Submission ID: " + request.getSubmissionId(), "success");
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created submission grades", "Submission ID: " + request.getSubmissionId(), "failed");
            throw ex;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubmissionGradeBatchResponse> update(Authentication authentication, @PathVariable("id") Long submissionId,
                                                               @RequestBody SubmissionGradeBatchRequest request) {
        try {
            SubmissionGradeBatchResponse updated = submissionGradeService.replaceGrades(submissionId, request);
            activityLogService.log(authentication, "Updated submission grades", "Submission ID: " + submissionId, "success");
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated submission grades", "Submission ID: " + submissionId, "failed");
            throw ex;
        }
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<SubmissionGradeBatchResponse> getBySubmissionPath(@PathVariable("submissionId") Long submissionId) {
        SubmissionGradeBatchResponse response = submissionGradeService.getGradesBySubmission(submissionId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<SubmissionGradeBatchResponse> getBySubmission(@RequestParam("submissionId") Long submissionId) {
        SubmissionGradeBatchResponse responses = submissionGradeService.getGradesBySubmission(submissionId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

}

