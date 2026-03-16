package com.grade.forge.grading.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.grading.dto.SubmissionGradeBatchResponse;
import com.grade.forge.grading.dto.SubmissionGradeItemResponse;
import com.grade.forge.grading.dto.SubmissionGradeRequest;
import com.grade.forge.grading.dto.SubmissionGradeResponse;
import com.grade.forge.grading.dto.SubmissionGradeBatchRequest;
import com.grade.forge.grading.dto.SubmissionGradeItemRequest;
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
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionGradeService {

    private final SubmissionGradeRepository submissionGradeRepository;
    private final SubmissionRepository submissionRepository;
    private final RubricSubCriteriaRepository rubricSubCriteriaRepository;


    public SubmissionGradeBatchResponse createGrades(SubmissionGradeBatchRequest request) {
        validateBatchRequest(request);

        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + request.getSubmissionId()));

        List<SubmissionGrade> gradesToSave = buildGradesFromRequest(submission, request.getGrades());

        List<SubmissionGrade> savedGrades = submissionGradeRepository.saveAll(gradesToSave);
        submission.setStatus(SubmissionStatus.GRADED);
        submissionRepository.save(submission);
        return mapToBatchResponse(submission.getId(), savedGrades);
    }

    public SubmissionGradeBatchResponse replaceGrades(Long submissionId, SubmissionGradeBatchRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request is required");
        }
        if (request.getSubmissionId() == null) {
            request.setSubmissionId(submissionId);
        } else if (!Objects.equals(request.getSubmissionId(), submissionId)) {
            throw new IllegalArgumentException("submissionId in path and body must match");
        }

        validateBatchRequest(request);

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        List<SubmissionGrade> existingGrades = submissionGradeRepository.findBySubmission_Id(submissionId);
        if (!existingGrades.isEmpty()) {
            submissionGradeRepository.deleteAll(existingGrades);
        }

        List<SubmissionGrade> gradesToSave = buildGradesFromRequest(submission, request.getGrades());
        List<SubmissionGrade> savedGrades = submissionGradeRepository.saveAll(gradesToSave);
        submission.setStatus(SubmissionStatus.GRADED);
        submissionRepository.save(submission);
        return mapToBatchResponse(submission.getId(), savedGrades);
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
    public SubmissionGradeBatchResponse getGradeBatch(Long id) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));
        Long submissionId = grade.getSubmission().getId();
        List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(submissionId);
        return mapToBatchResponse(submissionId, grades);
    }

    @Transactional(readOnly = true)
    public SubmissionGradeBatchResponse getGradesBySubmission(Long submissionId) {
        submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(submissionId);
        return mapToBatchResponse(submissionId, grades);
    }

    @Transactional(readOnly = true)
    public SubmissionGradeBatchResponse getGradeForCurrentStudent(String userEmail, Long id) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));

        if (!grade.getSubmission().getStudent().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not allowed to access this grade");
        }

        Long submissionId = grade.getSubmission().getId();
        List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(submissionId);
        return mapToBatchResponse(submissionId, grades);
    }

    @Transactional(readOnly = true)
    public SubmissionGradeBatchResponse getGradesForCurrentStudent(String userEmail, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getStudent().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not allowed to view grades for this submission");
        }

        List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(submissionId);
        return mapToBatchResponse(submissionId, grades);
    }

    public void deleteGrade(Long id) {
        SubmissionGrade grade = submissionGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission grade not found with id: " + id));
        submissionGradeRepository.delete(grade);
    }

    private void validateBatchRequest(SubmissionGradeBatchRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request is required");
        }
        if (request.getSubmissionId() == null) {
            throw new IllegalArgumentException("submissionId is required");
        }
        if (request.getGrades() == null || request.getGrades().isEmpty()) {
            throw new IllegalArgumentException("grades are required");
        }
        for (SubmissionGradeItemRequest grade : request.getGrades()) {
            if (grade.getRubricSubCriteriaId() == null) {
                throw new IllegalArgumentException("rubricSubCriteriaId is required for each grade");
            }
            if (grade.getAwardedScore() == null) {
                throw new IllegalArgumentException("awardedScore is required for each grade");
            }
        }
    }

    private List<SubmissionGrade> buildGradesFromRequest(Submission submission, List<SubmissionGradeItemRequest> gradeItems) {
        Set<Long> subCriteriaIds = gradeItems.stream()
                .map(SubmissionGradeItemRequest::getRubricSubCriteriaId)
                .collect(Collectors.toSet());

        Map<Long, RubricSubCriteria> subCriteriaMap = rubricSubCriteriaRepository.findAllById(subCriteriaIds).stream()
                .collect(Collectors.toMap(RubricSubCriteria::getId, Function.identity()));

        List<SubmissionGrade> gradesToSave = new ArrayList<>();
        for (SubmissionGradeItemRequest gradeRequest : gradeItems) {
            RubricSubCriteria subCriteria = subCriteriaMap.get(gradeRequest.getRubricSubCriteriaId());
            if (subCriteria == null) {
                throw new ResourceNotFoundException("Rubric sub-criteria not found with id: " + gradeRequest.getRubricSubCriteriaId());
            }

            validateSubCriteriaMatchesAssignment(submission, subCriteria);
            validateScore(subCriteria, gradeRequest.getAwardedScore());

            SubmissionGrade grade = new SubmissionGrade();
            grade.setSubmission(submission);
            grade.setRubricSubCriteria(subCriteria);
            grade.setAwardedScore(gradeRequest.getAwardedScore());
            grade.setFeedback(gradeRequest.getFeedback());
            gradesToSave.add(grade);
        }
        return gradesToSave;
    }

    private void validateSubCriteriaMatchesAssignment(Submission submission, RubricSubCriteria subCriteria) {
        Rubric assignmentRubric = submission.getAssignment().getRubric();
        RubricCriteria parentCriteria = subCriteria.getCriteria();
        if (assignmentRubric != null && parentCriteria != null && !Objects.equals(assignmentRubric.getId(), parentCriteria.getRubric().getId())) {
            throw new IllegalArgumentException("Rubric sub-criteria does not belong to the assignment rubric");
        }
    }

    private void validateScore(RubricSubCriteria subCriteria, Double score) {
        if (score < 0) {
            throw new IllegalArgumentException("awardedScore cannot be negative");
        }
        Double maxAllowed = subCriteria.getMaxScore();
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

    private SubmissionGradeBatchResponse mapToBatchResponse(Long submissionId, List<SubmissionGrade> grades) {
        List<SubmissionGradeItemResponse> gradeResponses = grades.stream()
                .map(grade -> SubmissionGradeItemResponse.builder()
                        .rubricSubCriteriaId(grade.getRubricSubCriteria().getId())
                        .awardedScore(grade.getAwardedScore())
                        .feedback(grade.getFeedback())
                        .build())
                .collect(Collectors.toList());
        return SubmissionGradeBatchResponse.builder()
                .submissionId(submissionId)
                .grades(gradeResponses)
                .build();
    }
}
