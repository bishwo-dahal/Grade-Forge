package com.grade.forge.grading.controller;

import com.grade.forge.grading.dto.SubmissionGradeBatchRequest;
import com.grade.forge.grading.dto.SubmissionGradeBatchResponse;
import com.grade.forge.grading.service.SubmissionGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/faculty/submission-grades")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class SubmissionGradeController {

    private final SubmissionGradeService submissionGradeService;

    @PostMapping
    public ResponseEntity<SubmissionGradeBatchResponse> create(@RequestBody SubmissionGradeBatchRequest request) {
        SubmissionGradeBatchResponse created = submissionGradeService.createGrades(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubmissionGradeBatchResponse> update(@PathVariable("id") Long submissionId,
                                                               @RequestBody SubmissionGradeBatchRequest request) {
        SubmissionGradeBatchResponse updated = submissionGradeService.replaceGrades(submissionId, request);
        return new ResponseEntity<>(updated, HttpStatus.OK);
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
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        submissionGradeService.deleteGrade(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
