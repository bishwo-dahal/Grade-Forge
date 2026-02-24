package com.grade.forge.search.service;

import com.grade.forge.search.dto.StudentSearchResponseDto;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.student.entity.Student;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentSearchService {

    private final StudentRepository studentRepository;

    public List<StudentSearchResponseDto> search(String keyword, Long courseId) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return studentRepository
                .findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCaseOrCwidContainingIgnoreCase(keyword, keyword, keyword)
                .stream()
                .map(student -> mapToResponse(student, courseId))
                .collect(Collectors.toList());
    }

    private StudentSearchResponseDto mapToResponse(Student student, Long courseId) {

        EnrolledStatus courseStatus = EnrolledStatus.NOT_ENROLLED;

        if (student.getEnrollments() != null) {
            courseStatus = student.getEnrollments().stream()
                    .filter(enrollment ->
                            enrollment.getCourse() != null &&
                                    enrollment.getCourse().getId().equals(courseId))
                    .map(Enrollment::getEnrolledStatus)
                    .findFirst()
                    .orElse(EnrolledStatus.NOT_ENROLLED);
        }

        return StudentSearchResponseDto.builder()
                .id(student.getId())
                .userId(student.getUser() != null ? student.getUser().getId() : null)
                .cwid(student.getCwid())
                .major(student.getMajor())
                .canvasUserId(student.getCanvasUserId())
                .name(student.getUser() != null ? student.getUser().getName() : null)
                .email(student.getUser() != null ? student.getUser().getEmail() : null)
                .enrolledStatus(courseStatus) // ✅ specific to course
                .build();
    }
}
