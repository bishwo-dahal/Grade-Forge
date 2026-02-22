package com.grade.forge.search.service;

import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentSearchService {

    private final AssignmentRepository assignmentRepository;

    public List<AssignmentResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return assignmentRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AssignmentResponse mapToResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourse() != null ? assignment.getCourse().getId() : null)
                .courseName(assignment.getCourse() != null ? assignment.getCourse().getName() : null)
                .languageId(assignment.getProgrammingLanguage() != null ? assignment.getProgrammingLanguage().getId() : null)
                .languageName(assignment.getProgrammingLanguage() != null ? assignment.getProgrammingLanguage().getName() : null)
                .name(assignment.getName())
                .description(assignment.getDescription())
                .totalPoints(assignment.getTotalPoints())
                .submissionType(assignment.getSubmissionType())
                .starterCodeUrl(assignment.getStarterCodeUrl())
                .availableFrom(assignment.getAvailableFrom())
                .dueDate(assignment.getDueDate())
                .lateDueDate(assignment.getLateDueDate())
                .rubricId(assignment.getRubric() != null ? assignment.getRubric().getId() : null)
                .rubricName(assignment.getRubric() != null ? assignment.getRubric().getName() : null)
                .build();
    }
}

