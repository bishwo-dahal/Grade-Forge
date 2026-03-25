package com.grade.forge.grading.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.grading.dto.SubmissionGradeBatchRequest;
import com.grade.forge.grading.dto.SubmissionGradeBatchResponse;
import com.grade.forge.grading.service.SubmissionGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/faculty/submission-grades")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class SubmissionGradeController {

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
        try {
            submissionGradeService.deleteGrade(id);
            activityLogService.log(authentication, "Deleted submission grade", "Grade ID: " + id, "success");
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted submission grade", "Grade ID: " + id, "failed");
            throw ex;
        }
    }
}
