package com.grade.forge.enrollment.service;

import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.enrollment.dto.EnrollmentResponse;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.student.entity.Student;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public EnrollmentResponse waitListCurrentStudentInCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return waitListStudentInCourse(student, courseId);
    }

    public EnrollmentResponse dropCurrentStudentFromCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return dropStudentFromCourse(student, courseId);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCurrentStudentEnrollments(String userEmail) {
        Student student = getStudentByUserEmail(userEmail);
        return getEnrollmentsForStudent(student);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCourseEnrollments(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        return enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EnrollmentResponse waitListStudentInCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Enrollment existingEnrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElse(null);

        if (existingEnrollment == null) {
            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setEnrolledStatus(EnrolledStatus.WAITLIST);
            enrollment.setEnrolledAt(LocalDateTime.now());

            Enrollment saved = enrollmentRepository.save(enrollment);
            return mapToResponse(saved);
        }
        else{
            existingEnrollment.setEnrolledAt(LocalDateTime.now());
            existingEnrollment.setEnrolledStatus(EnrolledStatus.WAITLIST);
            Enrollment saved = enrollmentRepository.save(existingEnrollment);
            return mapToResponse(saved);
        }


    }

    private EnrollmentResponse dropStudentFromCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + studentId + " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.DROPPED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    public EnrollmentResponse enrollCurrentStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentById(studentId);
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + student.getId()+ " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    public EnrollmentResponse dropStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentById(studentId);
        return dropStudentFromCourse(student, courseId);
    }


    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCurrentStudentWaitlistedEnrollments(String userEmail) {
        Student student = getStudentByUserEmail(userEmail);
        return enrollmentRepository.findByStudent_Id(student.getId()).stream()
                .filter(enrollment -> EnrolledStatus.WAITLIST.equals(enrollment.getEnrolledStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    protected List<EnrollmentResponse> getEnrollmentsForStudent(Student student) {
        Long studentId = student.getId();
        return enrollmentRepository.findByStudent_Id(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Student getStudentByUserEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + email));
    }

    private Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        Student student = enrollment.getStudent();
        String studentName = student != null && student.getUser() != null ? student.getUser().getName() : null;
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(student != null ? student.getId() : null)
                .studentName(studentName)
                .courseId(enrollment.getCourse() != null ? enrollment.getCourse().getId() : null)
                .enrolledAt(enrollment.getEnrolledAt())
                .enrolledStatus(enrollment.getEnrolledStatus())
                .grade(enrollment.getGrade())
                .build();
    }

    public EnrollmentResponse enrollStudentInCourse(Long studentId, Long courseId) {
        if (studentId == null || courseId == null) {
            throw new IllegalArgumentException("studentId and courseId are required");
        }
        Student student = getStudentById(studentId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId())
                .orElseGet(() -> {
                    Enrollment e = new Enrollment();
                    e.setStudent(student);
                    e.setCourse(course);
                    return e;
                });

        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        enrollment.setEnrolledAt(LocalDateTime.now());

        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }
}
