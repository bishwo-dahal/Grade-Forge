package com.grade.forge.search.service;

import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.coursemgmt.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseSearchService {

    private final CourseRepository courseRepository;
    private final CourseService courseService;

    public List<CourseResponseDto> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return courseRepository
                .findByNameContainingIgnoreCaseOrCourseCodeContainingIgnoreCase(keyword, keyword)
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    private CourseResponseDto mapToResponseDto(Course course) {
        return courseService.getCourseById(course.getId());
    }
}

