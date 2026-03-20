package com.grade.forge.coursemgmt.service;

import com.grade.forge.coursemgmt.dto.CourseRequestDto;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.semester.entity.Semester;
import com.grade.forge.semester.repository.SemesterRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.student.entity.Student;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import com.grade.forge.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;

    private final FacultyRepository facultyRepository;
    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**

    /**
     * Create a new course using faculty resolved from authenticated email
     */
    public CourseResponseDto createCourse(String email, CourseRequestDto courseRequestDto) {
        if (courseRequestDto.getSemesterId() == null) {
            throw new ResourceNotFoundException("Semester is required to create a course");
        }

        Faculty faculty = facultyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found for email: " + email));
        log.info(faculty.getDepartment()+ " "+ faculty.getEmail() + " " + faculty.getName());
        return createCourseInternal(courseRequestDto, faculty);
    }

    private CourseResponseDto createCourseInternal(CourseRequestDto courseRequestDto, Faculty faculty) {
        Semester semester = semesterRepository.findById(courseRequestDto.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + courseRequestDto.getSemesterId()));

        // Map DTO to entity manually to avoid ModelMapper conflicts
        Course course = new Course();
        course.setName(courseRequestDto.getName());
        course.setCourseCode(courseRequestDto.getCourseCode());
        course.setSection(courseRequestDto.getSection());
        course.setDescription(courseRequestDto.getDescription());
        course.setImageUrl(courseRequestDto.getImageUrl());
        course.setCanvasCourseId(courseRequestDto.getCanvasCourseId());
        course.setIsPublished(courseRequestDto.getIsPublished());

        course.setFaculty(faculty);
        course.setSemester(semester);
        // Set active by default if not provided
        if (course.getActive() == null) {
            course.setActive(true);
        }
        if (course.getIsPublished() == null) {
            course.setIsPublished(false);
        }

        Course savedCourse = courseRepository.save(course);
        log.info("Course created: {}", savedCourse.getId());
        return mapToResponseDto(savedCourse);
    }

    /**
     * Update an existing course
     * @param id the course id
     * @param courseRequestDto the updated course request DTO
     * @return the updated course response DTO
     */
    public CourseResponseDto updateCourse(Long id, CourseRequestDto courseRequestDto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        // Map non-null fields from DTO to entity
        if (courseRequestDto.getName() != null) {
            course.setName(courseRequestDto.getName());
        }
        if (courseRequestDto.getCourseCode() != null) {
            course.setCourseCode(courseRequestDto.getCourseCode());
        }
        if (courseRequestDto.getSection() != null) {
            course.setSection(courseRequestDto.getSection());
        }
        if (courseRequestDto.getDescription() != null) {
            course.setDescription(courseRequestDto.getDescription());
        }
        if (courseRequestDto.getImageUrl() != null) {
            course.setImageUrl(courseRequestDto.getImageUrl());
        }
        if (courseRequestDto.getCanvasCourseId() != null) {
            course.setCanvasCourseId(courseRequestDto.getCanvasCourseId());
        }
        if (courseRequestDto.getActive() != null) {
            course.setActive(courseRequestDto.getActive());
        }
        if (courseRequestDto.getIsPublished() != null) {
            course.setIsPublished(courseRequestDto.getIsPublished());
        }
        if (courseRequestDto.getFacultyId() != null) {
            // Validate that the new faculty exists
            Faculty faculty = facultyRepository.findById(courseRequestDto.getFacultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + courseRequestDto.getFacultyId()));
            course.setFaculty(faculty);
        }
        if (courseRequestDto.getSemesterId() != null) {
            Semester semester = semesterRepository.findById(courseRequestDto.getSemesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + courseRequestDto.getSemesterId()));
            course.setSemester(semester);
        }

        Course updatedCourse = courseRepository.save(course);
        return mapToResponseDto(updatedCourse);
    }

    /**
     * Delete a course created by the authenticated faculty
     * @param id the course id
     * @param email authenticated faculty email
     */
    public void deleteCourseForFaculty(Long id, String email) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        if (course.getFaculty() == null || course.getFaculty().getEmail() == null || !course.getFaculty().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You are not authorized to delete this course");
        }

        courseRepository.delete(course);
    }

    /**
     * Delete a course by id (admin use)
     * @param id the course id
     */
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        courseRepository.delete(course);
    }

    /**
     * Disable a course (soft delete)
     * @param id the course id
     * @return the disabled course response DTO
     */
    public CourseResponseDto disableCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        course.setActive(false);
        Course disabledCourse = courseRepository.save(course);
        return mapToResponseDto(disabledCourse);
    }

    /**
     * Get a course by id
     * @param id the course id
     * @return the course response DTO
     */
    public CourseResponseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        return mapToResponseDto(course);
    }

    /**
     * Get all courses
     * @return list of all course response DTOs
     */
    public List<CourseResponseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all active courses
     * @return list of active course response DTOs
     */
    public List<CourseResponseDto> getActiveCourses() {
        return courseRepository.findAll().stream()
                .filter(course -> Boolean.TRUE.equals(course.getActive()))
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all courses for a faculty user id
     * @param userId the user id associated with a faculty
     * @return list of course response DTOs
     */
    public List<CourseResponseDto> getCoursesByUserId(Long userId) {
        Faculty faculty = facultyRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found for user id: " + userId));

        return courseRepository.findByFaculty_Id(faculty.getId()).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all courses for a faculty email
     * @param email the authenticated user's email
     * @return list of course response DTOs
     */
    public List<CourseResponseDto> getCoursesByUserEmail(String email) {
        Faculty faculty = facultyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found for email: " + email));

        log.info(faculty.getName());
        log.info(faculty.getEmail());

     Users user = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
      log.info(String.valueOf(user.getId()));


        return courseRepository.findByFaculty_Id(faculty.getId()).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all courses by faculty id (admin use)
     */
    public List<CourseResponseDto> getCoursesByFacultyId(Long facultyId) {
        return courseRepository.findByFaculty_Id(facultyId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public List<CourseResponseDto> getCoursesForStudentEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + email));

        return enrollmentRepository.findByStudent_Id(student.getId()).stream()
                .filter(enrollment -> EnrolledStatus.ENROLLED.equals(enrollment.getEnrolledStatus()))
                .map(Enrollment::getCourse)
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Map Course entity to CourseResponseDto
     * @param course the course entity
     * @return the course response DTO
     */
    private CourseResponseDto mapToResponseDto(Course course) {
         CourseResponseDto.SemesterBasicDto semesterDto = CourseResponseDto.SemesterBasicDto.builder()
                 .id(course.getSemester().getId())
                 .name(course.getSemester().getName())
                 .startDate(course.getSemester().getStartDate().toString())
                 .endDate(course.getSemester().getEndDate().toString())
                 .build();

         CourseResponseDto.FacultyBasicDto facultyDto = CourseResponseDto.FacultyBasicDto.builder()
                 .id(course.getFaculty().getId())
                 .name(course.getFaculty().getName())
                 .email(course.getFaculty().getEmail())
                 .department(course.getFaculty().getDepartment())
                 .qualifications(course.getFaculty().getQualifications())
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
