package com.grade.forge.submission.controller;

import com.grade.forge.submission.dto.AuthorshipTriageUniversityAdminItem;
import com.grade.forge.submission.repository.SubmissionAuthorshipTriageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * University-wide view of faculty authorship triage labels (training / audit). Does not include raw submission text.
 */
@RestController
@RequestMapping("/api/v1/university_admin/authorship-triage-training")
@RequiredArgsConstructor
public class UniversityAdminAuthorshipTriageController {

    private final SubmissionAuthorshipTriageRepository submissionAuthorshipTriageRepository;

    @GetMapping
    public ResponseEntity<List<AuthorshipTriageUniversityAdminItem>> listTrainingRows() {
        return ResponseEntity.ok(submissionAuthorshipTriageRepository.findAllTrainingRowsForUniversityAdmin());
    }
}
