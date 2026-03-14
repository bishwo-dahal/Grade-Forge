package com.grade.forge.rubric.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.rubric.dto.RubricCriteriaRequest;
import com.grade.forge.rubric.dto.RubricCriteriaResponse;
import com.grade.forge.rubric.dto.RubricRequest;
import com.grade.forge.rubric.dto.RubricResponse;
import com.grade.forge.rubric.dto.RubricSubCriteriaRequest;
import com.grade.forge.rubric.dto.RubricSubCriteriaResponse;
import com.grade.forge.rubric.entity.Rubric;
import com.grade.forge.rubric.entity.RubricCriteria;
import com.grade.forge.rubric.entity.RubricSubCriteria;
import com.grade.forge.rubric.repository.RubricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RubricService {

    private final RubricRepository rubricRepository;
    private final FacultyRepository facultyRepository;

    public RubricResponse createRubric(RubricRequest request, String userEmail) {
        validateCreateRequest(request);
        Faculty faculty = resolveFacultyByEmail(userEmail);
        Rubric rubric = new Rubric();
        rubric.setName(request.getName());
        rubric.setDescription(request.getDescription());
        rubric.setFaculty(faculty);
        setCriteriaFromRequest(rubric, request.getCriteria());
        Rubric saved = rubricRepository.save(rubric);
        return mapToResponse(saved);
    }

    public RubricResponse updateRubric(Long id, RubricRequest request) {
        validateUpdateRequest(request);
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric not found with id: " + id));

        if (request.getName() != null) {
            rubric.setName(request.getName());
        }
        if (request.getDescription() != null) {
            rubric.setDescription(request.getDescription());
        }
        if (request.getFacultyId() != null) {
            rubric.setFaculty(resolveFaculty(request.getFacultyId()));
        }
        if (request.getCriteria() != null) {
            rubric.getCriteria().clear();
            setCriteriaFromRequest(rubric, request.getCriteria());
        }

        Rubric saved = rubricRepository.save(rubric);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public RubricResponse getRubric(Long id) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric not found with id: " + id));
        return mapToResponse(rubric);
    }

    public void deleteRubric(Long id) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rubric not found with id: " + id));
        rubricRepository.delete(rubric);
    }

    @Transactional(readOnly = true)
    public List<RubricResponse> getRubricByFacultyId(Long facultyId) {
        List<Rubric> rubrics = rubricRepository.findByFaculty_Id(facultyId);
        if (rubrics.isEmpty()) {
            throw new ResourceNotFoundException("Rubric not found for faculty id: " + facultyId);
        }
        return rubrics.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RubricResponse> getRubricByFacultyEmail(String email) {
        Faculty faculty = facultyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + email));
        List<Rubric> rubrics = rubricRepository.findByFaculty_Id(faculty.getId());
        if (rubrics.isEmpty()) {
            throw new ResourceNotFoundException("Rubric not found for faculty id: " + faculty.getId());
        }
        return rubrics.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void validateCreateRequest(RubricRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Rubric request cannot be null");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Rubric name is required");
        }
        if (request.getCriteria() == null || request.getCriteria().isEmpty()) {
            throw new IllegalArgumentException("At least one rubric criteria is required");
        }
        request.getCriteria().forEach(this::validateCriteriaRequest);
    }

    private void validateUpdateRequest(RubricRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Rubric request cannot be null");
        }
        if (request.getName() != null && request.getName().isBlank()) {
            throw new IllegalArgumentException("Rubric name cannot be blank");
        }
        if (request.getCriteria() != null) {
            if (request.getCriteria().isEmpty()) {
                throw new IllegalArgumentException("Rubric criteria list cannot be empty when provided");
            }
            request.getCriteria().forEach(this::validateCriteriaRequest);
        }
    }

    private void validateCriteriaRequest(RubricCriteriaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Criteria cannot be null");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Criteria title is required");
        }
        if (request.getSubCriteria() == null || request.getSubCriteria().isEmpty()) {
            throw new IllegalArgumentException("At least one sub-criteria is required for each criteria");
        }
        request.getSubCriteria().forEach(this::validateSubCriteriaRequest);
    }

    private void validateSubCriteriaRequest(RubricSubCriteriaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Sub-criteria cannot be null");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Sub-criteria description is required");
        }
        if (request.getMaxScore() == null || request.getMaxScore() <= 0) {
            throw new IllegalArgumentException("Sub-criteria maxScore must be positive");
        }
        if (request.getWeight() != null && request.getWeight() < 0) {
            throw new IllegalArgumentException("Sub-criteria weight cannot be negative");
        }
    }

    private void setCriteriaFromRequest(Rubric rubric, List<RubricCriteriaRequest> criteriaRequests) {
        if (criteriaRequests == null) {
            return;
        }
        criteriaRequests.stream()
                .filter(Objects::nonNull)
                .forEach(criteriaRequest -> {
                    validateCriteriaRequest(criteriaRequest);
                    RubricCriteria criteria = new RubricCriteria();
                    criteria.setTitle(criteriaRequest.getTitle());
                    criteria.setRubric(rubric);
                    criteriaRequest.getSubCriteria().stream()
                            .filter(Objects::nonNull)
                            .forEach(subRequest -> {
                                validateSubCriteriaRequest(subRequest);
                                RubricSubCriteria sub = new RubricSubCriteria();
                                sub.setDescription(subRequest.getDescription());
                                sub.setMaxScore(subRequest.getMaxScore());
                                sub.setWeight(subRequest.getWeight());
                                criteria.addSubCriteria(sub);
                            });
                    rubric.getCriteria().add(criteria);
                });
    }

    private Faculty resolveFaculty(Long facultyId) {
        return facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));
    }

    private Faculty resolveFacultyByEmail(String email) {
        return facultyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + email));
    }

    private RubricResponse mapToResponse(Rubric rubric) {
        List<RubricCriteriaResponse> criteriaResponses = rubric.getCriteria().stream()
                .map(criteria -> RubricCriteriaResponse.builder()
                        .id(criteria.getId())
                        .title(criteria.getTitle())
                        .subCriteria((criteria.getSubCriteria() == null ? List.<RubricSubCriteria>of() : criteria.getSubCriteria()).stream()
                                .map(sub -> RubricSubCriteriaResponse.builder()
                                        .id(sub.getId())
                                        .description(sub.getDescription())
                                        .maxScore(sub.getMaxScore())
                                        .weight(sub.getWeight())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        return RubricResponse.builder()
                .id(rubric.getId())
                .name(rubric.getName())
                .description(rubric.getDescription())
                .facultyId(rubric.getFaculty() != null ? rubric.getFaculty().getId() : null)
                .criteria(criteriaResponses)
                .build();
    }
}

