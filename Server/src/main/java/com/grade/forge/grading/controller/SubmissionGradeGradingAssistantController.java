package com.grade.forge.grading.controller;

import com.grade.forge.grading.dto.SubmissionGradeBatchRequest;
import com.grade.forge.grading.dto.SubmissionGradeBatchResponse;
import com.grade.forge.grading.service.SubmissionGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/grading-assistant/submission-grades")
@RequiredArgsConstructor
public class SubmissionGradeGradingAssistantController {

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

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionGradeBatchResponse> get(@PathVariable Long id) {
        SubmissionGradeBatchResponse response = submissionGradeService.getGradeBatch(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<SubmissionGradeBatchResponse> getBySubmission(@RequestParam("submissionId") Long submissionId) {
        SubmissionGradeBatchResponse responses = submissionGradeService.getGradesBySubmission(submissionId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

}

