package com.grade.forge.grading.controller;

import com.grade.forge.grading.dto.SubmissionGradeBatchRequest;
import com.grade.forge.grading.dto.SubmissionGradeResponse;
import com.grade.forge.grading.service.SubmissionGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1/grading-assistant/submission-grades")
@RequiredArgsConstructor
public class SubmissionGradeGradingAssistantController {

    private final SubmissionGradeService submissionGradeService;

    @PostMapping
    public ResponseEntity<List<SubmissionGradeResponse>> create(@RequestBody SubmissionGradeBatchRequest request) {
        List<SubmissionGradeResponse> created = submissionGradeService.createGrades(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<List<SubmissionGradeResponse>> update(@PathVariable("id") Long submissionId,
                                                                @RequestBody SubmissionGradeBatchRequest request) {
        List<SubmissionGradeResponse> updated = submissionGradeService.replaceGrades(submissionId, request);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionGradeResponse> get(@PathVariable Long id) {
        SubmissionGradeResponse response = submissionGradeService.getGrade(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<SubmissionGradeResponse>> getBySubmission(@RequestParam("submissionId") Long submissionId) {
        List<SubmissionGradeResponse> responses = submissionGradeService.getGradesBySubmission(submissionId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

}

