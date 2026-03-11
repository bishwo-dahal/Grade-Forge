package com.grade.forge.search.service;

import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
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
        CourseResponseDto.SemesterBasicDto semesterDto = CourseResponseDto.SemesterBasicDto.builder()
                .id(course.getSemester() != null ? course.getSemester().getId() : null)
                .name(course.getSemester() != null ? course.getSemester().getName() : null)
                .startDate(course.getSemester() != null && course.getSemester().getStartDate() != null ? course.getSemester().getStartDate().toString() : null)
                .endDate(course.getSemester() != null && course.getSemester().getEndDate() != null ? course.getSemester().getEndDate().toString() : null)
                .build();

        CourseResponseDto.FacultyBasicDto facultyDto = CourseResponseDto.FacultyBasicDto.builder()
                .id(course.getFaculty() != null ? course.getFaculty().getId() : null)
                .name(course.getFaculty() != null ? course.getFaculty().getName() : null)
                .email(course.getFaculty() != null ? course.getFaculty().getEmail() : null)
                .department(course.getFaculty() != null ? course.getFaculty().getDepartment() : null)
                .qualifications(course.getFaculty() != null ? course.getFaculty().getQualifications() : null)
                .build();

        return CourseResponseDto.builder()
                .id(course.getId())
                .name(course.getName())
                .courseCode(course.getCourseCode())
                .section(course.getSection())
                .description(course.getDescription())
                .imageUrl(course.getImageUrl())
                .canvasCourseId(course.getCanvasCourseId())
                .active(course.getActive())
                .isPublished(course.getIsPublished())
                .semester(semesterDto)
                .faculty(facultyDto)
                .build();
    }
}

