package com.grade.forge.search.service;

import com.grade.forge.search.dto.StudentSearchResponseDto;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentSearchService {

    private final StudentRepository studentRepository;

    public List<StudentSearchResponseDto> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return studentRepository
                .findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCaseOrCwidContainingIgnoreCase(keyword, keyword, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private StudentSearchResponseDto mapToResponse(Student student) {
        Map<String, Object> preferences = student.getPreferences();
        return StudentSearchResponseDto.builder()
                .id(student.getId())
                .userId(student.getUser() != null ? student.getUser().getId() : null)
                .cwid(student.getCwid())
                .major(student.getMajor())
                .canvasUserId(student.getCanvasUserId())
                .username(student.getUser() != null ? student.getUser().getName() : null)
                .email(student.getUser() != null ? student.getUser().getEmail() : null)
                .preferences(preferences)
                .build();
    }
}
