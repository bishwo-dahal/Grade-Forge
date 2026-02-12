package com.grade.forge.assignment.service;

import com.grade.forge.assignment.dto.AssignmentRequest;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.enums.SubmissionType;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.programminglanguage.repository.ProgrammingLanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final ProgrammingLanguageRepository programmingLanguageRepository;

    public AssignmentResponse createAssignment(AssignmentRequest request) {
        validateCreate(request);
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));
        ProgrammingLanguage language = programmingLanguageRepository.findById(request.getLanguageId())
                .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + request.getLanguageId()));

        Assignment assignment = mapToEntity(request, new Assignment());
        assignment.setCourse(course);
        assignment.setProgrammingLanguage(language);

        Assignment saved = assignmentRepository.save(assignment);
        return mapToResponse(saved);
    }

    public AssignmentResponse updateAssignment(Long id, AssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));
            assignment.setCourse(course);
        }
        if (request.getLanguageId() != null) {
            ProgrammingLanguage language = programmingLanguageRepository.findById(request.getLanguageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + request.getLanguageId()));
            assignment.setProgrammingLanguage(language);
        }
        if (request.getName() != null) {
            assignment.setName(request.getName());
        }
        if (request.getDescription() != null) {
            assignment.setDescription(request.getDescription());
        }
        if (request.getTotalPoints() != null) {
            assignment.setTotalPoints(request.getTotalPoints());
        }
        if (request.getSubmissionType() != null) {
            assignment.setSubmissionType(request.getSubmissionType());
        }
        if (request.getStarterCodeUrl() != null) {
            assignment.setStarterCodeUrl(request.getStarterCodeUrl());
        }
        if (request.getAvailableFrom() != null) {
            assignment.setAvailableFrom(request.getAvailableFrom());
        }
        if (request.getDueDate() != null) {
            assignment.setDueDate(request.getDueDate());
        }
        if (request.getLateDueDate() != null) {
            assignment.setLateDueDate(request.getLateDueDate());
        }

        validateTimeline(assignment.getAvailableFrom(), assignment.getDueDate(), assignment.getLateDueDate());

        Assignment saved = assignmentRepository.save(assignment);
        return mapToResponse(saved);
    }

    public AssignmentResponse getAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return mapToResponse(assignment);
    }

    public List<AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AssignmentResponse> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourse_Id(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        assignmentRepository.delete(assignment);
    }

    private void validateCreate(AssignmentRequest request) {
        if (request.getCourseId() == null) {
            throw new IllegalArgumentException("courseId is required");
        }
        if (request.getLanguageId() == null) {
            throw new IllegalArgumentException("languageId is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Assignment name is required");
        }
        if (request.getTotalPoints() == null || request.getTotalPoints() < 0) {
            throw new IllegalArgumentException("totalPoints must be zero or positive");
        }
        if (request.getSubmissionType() == null) {
            throw new IllegalArgumentException("submissionType is required");
        }
        validateTimeline(request.getAvailableFrom(), request.getDueDate(), request.getLateDueDate());
    }

    private void validateTimeline(LocalDateTime availableFrom, LocalDateTime dueDate, LocalDateTime lateDueDate) {
        if (dueDate != null && availableFrom != null && dueDate.isBefore(availableFrom)) {
            throw new IllegalArgumentException("dueDate must be after availableFrom");
        }
        if (lateDueDate != null) {
            LocalDateTime compareFrom = dueDate != null ? dueDate : availableFrom;
            if (compareFrom != null && lateDueDate.isBefore(compareFrom)) {
                throw new IllegalArgumentException("lateDueDate must be after dueDate");
            }
        }
    }

    private Assignment mapToEntity(AssignmentRequest request, Assignment assignment) {
        assignment.setName(request.getName());
        assignment.setDescription(request.getDescription());
        assignment.setTotalPoints(request.getTotalPoints());
        assignment.setSubmissionType(request.getSubmissionType());
        assignment.setStarterCodeUrl(request.getStarterCodeUrl());
        assignment.setAvailableFrom(request.getAvailableFrom());
        assignment.setDueDate(request.getDueDate());
        assignment.setLateDueDate(request.getLateDueDate());
        return assignment;
    }

    private AssignmentResponse mapToResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourse().getId())
                .courseName(assignment.getCourse().getName())
                .languageId(assignment.getProgrammingLanguage().getId())
                .languageName(assignment.getProgrammingLanguage().getName())
                .name(assignment.getName())
                .description(assignment.getDescription())
                .totalPoints(assignment.getTotalPoints())
                .submissionType(assignment.getSubmissionType())
                .starterCodeUrl(assignment.getStarterCodeUrl())
                .availableFrom(assignment.getAvailableFrom())
                .dueDate(assignment.getDueDate())
                .lateDueDate(assignment.getLateDueDate())
                .build();
    }
}

