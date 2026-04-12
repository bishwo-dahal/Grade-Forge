package com.grade.forge.courseassistant.service;

import com.grade.forge.courseassistant.dto.CourseAssistantRequest;
import com.grade.forge.courseassistant.dto.CourseAssistantResponse;
import com.grade.forge.courseassistant.entity.CourseAssistant;
import com.grade.forge.courseassistant.repository.CourseAssistantRepository;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.coursemgmt.service.CourseService;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import com.grade.forge.gradingassistant.repository.GradingAssistantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseAssistantService {

    private final CourseAssistantRepository courseAssistantRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final GradingAssistantRepository gradingAssistantRepository;
    private final CourseService courseService;

    public CourseAssistantResponse assignAssistant(CourseAssistantRequest request, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        Course course = resolveCourseForFaculty(request.getCourseId(), faculty.getId());
        GradingAssistant ga = resolveGradingAssistantForFaculty(request.getGradingAssistantId(), faculty.getId());

        if (courseAssistantRepository.existsByGradingAssistant_IdAndCourse_Id(ga.getId(), course.getId())) {
            throw new IllegalArgumentException("Grading assistant is already assigned to this course");
        }

        CourseAssistant courseAssistant = CourseAssistant.builder()
                .course(course)
                .gradingAssistant(ga)
                .build();

        CourseAssistant saved = courseAssistantRepository.save(courseAssistant);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CourseAssistantResponse> listAssistants(Long courseId, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        if (courseId != null) {
            resolveCourseForFaculty(courseId, faculty.getId());
            return courseAssistantRepository.findAllByCourse_IdAndCourse_Faculty_Id(courseId, faculty.getId()).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return courseAssistantRepository.findAllByCourse_Faculty_Id(faculty.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CourseAssistantResponse updateAssistant(Long id, CourseAssistantRequest request, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        CourseAssistant courseAssistant = findByIdAndFaculty(id, faculty.getId());

        Course targetCourse = courseAssistant.getCourse();
        if (request.getCourseId() != null && !request.getCourseId().equals(courseAssistant.getCourse().getId())) {
            targetCourse = resolveCourseForFaculty(request.getCourseId(), faculty.getId());
        }

        GradingAssistant targetGa = courseAssistant.getGradingAssistant();
        if (request.getGradingAssistantId() != null && !request.getGradingAssistantId().equals(targetGa.getId())) {
            targetGa = resolveGradingAssistantForFaculty(request.getGradingAssistantId(), faculty.getId());
        }

        if (courseAssistantRepository.existsByGradingAssistant_IdAndCourse_Id(targetGa.getId(), targetCourse.getId())
                && !(targetGa.getId().equals(courseAssistant.getGradingAssistant().getId()) && targetCourse.getId().equals(courseAssistant.getCourse().getId()))) {
            throw new IllegalArgumentException("Grading assistant is already assigned to this course");
        }

        courseAssistant.setCourse(targetCourse);
        courseAssistant.setGradingAssistant(targetGa);

        CourseAssistant saved = courseAssistantRepository.save(courseAssistant);
        return mapToResponse(saved);
    }

    public void removeAssistant(Long id, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        CourseAssistant courseAssistant = findByIdAndFaculty(id, faculty.getId());
        courseAssistantRepository.delete(courseAssistant);
    }

    @Transactional(readOnly = true)
    public List<CourseResponseDto> listCoursesForGradingAssistant(Long gaUserId) {
        GradingAssistant ga = gradingAssistantRepository.findByUserId(gaUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found for user id: " + gaUserId));

        Map<Long, Course> coursesById = courseAssistantRepository.findAllByGradingAssistant_Id(ga.getId()).stream()
                .map(CourseAssistant::getCourse)
                .collect(Collectors.toMap(Course::getId, course -> course, (existing, replacement) -> existing));

        return coursesById.values().stream()
                .map(this::mapCourseToResponse)
                .collect(Collectors.toList());
    }

    private CourseAssistant findByIdAndFaculty(Long id, Long facultyId) {
        return courseAssistantRepository.findByIdAndCourse_Faculty_Id(id, facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Course assistant not found with id: " + id));
    }

    private Course resolveCourseForFaculty(Long courseId, Long facultyId) {
        if (courseId == null) {
            throw new IllegalArgumentException("courseId is required");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        if (!course.getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("Course does not belong to the current faculty");
        }
        return course;
    }

    private GradingAssistant resolveGradingAssistantForFaculty(Long gaId, Long facultyId) {
        if (gaId == null) {
            throw new IllegalArgumentException("gradingAssistantId is required");
        }
        return gradingAssistantRepository.findByIdAndFacultyId(gaId, facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found with id: " + gaId));
    }

    private Faculty resolveFaculty(Long facultyUserId) {
        return facultyRepository.findByUser_Id(facultyUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found for user id: " + facultyUserId));
    }

    private CourseAssistantResponse mapToResponse(CourseAssistant courseAssistant) {
        GradingAssistant ga = courseAssistant.getGradingAssistant();
        return CourseAssistantResponse.builder()
                .id(courseAssistant.getId())
                .courseId(courseAssistant.getCourse().getId())
                .courseName(courseAssistant.getCourse().getName())
                .gradingAssistantId(ga.getId())
                .gradingAssistantName(ga.getUser().getName())
                .gradingAssistantEmail(ga.getUser().getEmail())
                .assignedAt(courseAssistant.getAssignedAt())
                .build();
    }

    private CourseResponseDto mapCourseToResponse(Course course) {
        return courseService.getCourseById(course.getId());
    }
}

