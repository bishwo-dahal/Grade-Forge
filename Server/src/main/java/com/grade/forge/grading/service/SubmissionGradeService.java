package com.grade.forge.grading.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.grading.dto.SubmissionGradeRequest;
import com.grade.forge.grading.dto.SubmissionGradeResponse;
import com.grade.forge.grading.entity.SubmissionGrade;
import com.grade.forge.grading.repository.SubmissionGradeRepository;
import com.grade.forge.rubric.entity.Rubric;
import com.grade.forge.rubric.entity.RubricCriteria;
import com.grade.forge.rubric.entity.RubricSubCriteria;
import com.grade.forge.rubric.repository.RubricSubCriteriaRepository;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.enums.SubmissionStatus;
import com.grade.forge.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionGradeService {

    private final SubmissionGradeRepository submissionGradeRepository;
    private final SubmissionRepository submissionRepository;
    private final RubricSubCriteriaRepository rubricSubCriteriaRepository;

    public SubmissionGradeResponse createGrade(SubmissionGradeRequest request) {
        validateCreateRequest(request);
        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + request.getSubmissionId()));
        RubricSubCriteria subCriteria = rubricSubCriteriaRepository.findById(request.getRubricSubCriteriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Rubric sub-criteria not found with id: " + request.getRubricSubCriteriaId()));

        validateSubCriteriaMatchesAssignment(submission, subCriteria);
        validateScore(subCriteria, request.getAwardedScore());

        SubmissionGrade grade = new SubmissionGrade();
        grade.setSubmission(submission);
        grade.setRubricSubCriteria(subCriteria);
        grade.setAwardedScore(request.getAwardedScore());
        grade.setFeedback(request.getFeedback());

        SubmissionGrade saved = submissionGradeRepository.save(grade);
        submission.setStatus(SubmissionStatus.GRADED);
        submissionRepository.save(submission);

        return mapToResponse(saved);
    }

    public SubmissionGradeResponse updateGrade(Long id, SubmissionGradeRequest request) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));

        if (request.getRubricSubCriteriaId() != null && !Objects.equals(request.getRubricSubCriteriaId(), grade.getRubricSubCriteria().getId())) {
            RubricSubCriteria subCriteria = rubricSubCriteriaRepository.findById(request.getRubricSubCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rubric sub-criteria not found with id: " + request.getRubricSubCriteriaId()));
            validateSubCriteriaMatchesAssignment(grade.getSubmission(), subCriteria);
            grade.setRubricSubCriteria(subCriteria);
        }
        if (request.getAwardedScore() != null) {
            validateScore(grade.getRubricSubCriteria(), request.getAwardedScore());
            grade.setAwardedScore(request.getAwardedScore());
        }
        if (request.getFeedback() != null) {
            grade.setFeedback(request.getFeedback());
        }

        SubmissionGrade saved = submissionGradeRepository.save(grade);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubmissionGradeResponse getGrade(Long id) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));
        return mapToResponse(grade);
    }

    @Transactional(readOnly = true)
    public List<SubmissionGradeResponse> getGradesBySubmission(Long submissionId) {
        submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        return submissionGradeRepository.findBySubmission_Id(submissionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubmissionGradeResponse getGradeForCurrentStudent(String userEmail, Long id) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));

        if (!grade.getSubmission().getStudent().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not allowed to access this grade");
        }

        return mapToResponse(grade);
    }

    @Transactional(readOnly = true)
    public List<SubmissionGradeResponse> getGradesForCurrentStudent(String userEmail, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getStudent().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not allowed to view grades for this submission");
        }

        return submissionGradeRepository.findBySubmission_Id(submissionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteGrade(Long id) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));
        submissionGradeRepository.delete(grade);
    }

    private void validateCreateRequest(SubmissionGradeRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request is required");
        }
        if (request.getSubmissionId() == null) {
            throw new IllegalArgumentException("submissionId is required");
        }
        if (request.getRubricSubCriteriaId() == null) {
            throw new IllegalArgumentException("rubricSubCriteriaId is required");
        }
        if (request.getAwardedScore() == null) {
            throw new IllegalArgumentException("awardedScore is required");
        }
    }

    private void validateSubCriteriaMatchesAssignment(Submission submission, RubricSubCriteria subCriteria) {
        Rubric assignmentRubric = submission.getAssignment().getRubric();
        RubricCriteria parentCriteria = subCriteria.getCriteria();
        if (assignmentRubric != null && parentCriteria != null && !Objects.equals(assignmentRubric.getId(), parentCriteria.getRubric().getId())) {
            throw new IllegalArgumentException("Rubric sub-criteria does not belong to the assignment rubric");
        }
    }

    private void validateScore(RubricSubCriteria subCriteria, Integer score) {
        if (score < 0) {
            throw new IllegalArgumentException("awardedScore cannot be negative");
        }
        Integer maxAllowed = subCriteria.getMaxScore();
        if (maxAllowed != null && score > maxAllowed) {
            throw new IllegalArgumentException("awardedScore cannot exceed sub-criteria maxScore");
        }
    }

    private SubmissionGradeResponse mapToResponse(SubmissionGrade grade) {
        return SubmissionGradeResponse.builder()
                .id(grade.getId())
                .submissionId(grade.getSubmission().getId())
                .rubricSubCriteriaId(grade.getRubricSubCriteria().getId())
                .rubricSubCriteriaDescription(grade.getRubricSubCriteria().getDescription())
                .rubricCriteriaId(grade.getRubricSubCriteria().getCriteria() != null ? grade.getRubricSubCriteria().getCriteria().getId() : null)
                .rubricCriteriaTitle(grade.getRubricSubCriteria().getCriteria() != null ? grade.getRubricSubCriteria().getCriteria().getTitle() : null)
                .awardedScore(grade.getAwardedScore())
                .feedback(grade.getFeedback())
                .build();
    }
}
