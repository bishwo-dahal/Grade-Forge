package com.grade.forge.grading.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.grading.dto.SubmissionGradeRequest;
import com.grade.forge.grading.dto.SubmissionGradeResponse;
import com.grade.forge.grading.entity.SubmissionGrade;
import com.grade.forge.grading.repository.SubmissionGradeRepository;
import com.grade.forge.rubric.entity.Rubric;
import com.grade.forge.rubric.entity.RubricCriteria;
import com.grade.forge.rubric.entity.RubricSubCriteria;
import com.grade.forge.rubric.repository.RubricCriteriaRepository;
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
    private final RubricCriteriaRepository rubricCriteriaRepository;

    public SubmissionGradeResponse createGrade(SubmissionGradeRequest request) {
        validateCreateRequest(request);
        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + request.getSubmissionId()));
        RubricCriteria criteria = rubricCriteriaRepository.findById(request.getRubricCriteriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Rubric criteria not found with id: " + request.getRubricCriteriaId()));

        validateCriteriaMatchesAssignment(submission, criteria);
        validateScore(criteria, request.getAwardedScore());

        SubmissionGrade grade = new SubmissionGrade();
        grade.setSubmission(submission);
        grade.setRubricCriteria(criteria);
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

        if (request.getRubricCriteriaId() != null && !Objects.equals(request.getRubricCriteriaId(), grade.getRubricCriteria().getId())) {
            RubricCriteria criteria = rubricCriteriaRepository.findById(request.getRubricCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rubric criteria not found with id: " + request.getRubricCriteriaId()));
            validateCriteriaMatchesAssignment(grade.getSubmission(), criteria);
            grade.setRubricCriteria(criteria);
        }
        if (request.getAwardedScore() != null) {
            validateScore(grade.getRubricCriteria(), request.getAwardedScore());
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
        if (request.getRubricCriteriaId() == null) {
            throw new IllegalArgumentException("rubricCriteriaId is required");
        }
        if (request.getAwardedScore() == null) {
            throw new IllegalArgumentException("awardedScore is required");
        }
    }

    private void validateCriteriaMatchesAssignment(Submission submission, RubricCriteria criteria) {
        Rubric assignmentRubric = submission.getAssignment().getRubric();
        if (assignmentRubric != null && !Objects.equals(assignmentRubric.getId(), criteria.getRubric().getId())) {
            throw new IllegalArgumentException("Rubric criteria does not belong to the assignment rubric");
        }
    }

    private void validateScore(RubricCriteria criteria, Integer score) {
        if (score < 0) {
            throw new IllegalArgumentException("awardedScore cannot be negative");
        }
        int maxAllowed = (criteria.getSubCriteria() == null ? List.<RubricSubCriteria>of() : criteria.getSubCriteria())
                .stream()
                .filter(Objects::nonNull)
                .mapToInt(sub -> sub.getMaxScore() != null ? sub.getMaxScore() : 0)
                .sum();
        if (maxAllowed > 0 && score > maxAllowed) {
            throw new IllegalArgumentException("awardedScore cannot exceed criteria total maxScore");
        }
    }

    private SubmissionGradeResponse mapToResponse(SubmissionGrade grade) {
        return SubmissionGradeResponse.builder()
                .id(grade.getId())
                .submissionId(grade.getSubmission().getId())
                .rubricCriteriaId(grade.getRubricCriteria().getId())
                .rubricCriteriaTitle(grade.getRubricCriteria().getTitle())
                .awardedScore(grade.getAwardedScore())
                .feedback(grade.getFeedback())
                .build();
    }
}
