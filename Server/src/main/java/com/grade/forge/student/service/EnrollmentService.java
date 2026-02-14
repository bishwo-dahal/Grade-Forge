package com.grade.forge.student.service;

import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.entity.Enrollment;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.enums.EnrolledStatus;
import com.grade.forge.student.repository.EnrollmentRepository;
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

    public EnrollmentResponse enrollCurrentStudentInCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return enrollStudentInCourse(student, courseId);
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

    private EnrollmentResponse enrollStudentInCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        if (enrollmentRepository.existsByStudent_IdAndCourse_Id(studentId, courseId)) {
            throw new IllegalArgumentException("Student is already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        enrollment.setEnrolledAt(LocalDateTime.now());

        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    private EnrollmentResponse dropStudentFromCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + studentId + " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.DROPPED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
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

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudent() != null ? enrollment.getStudent().getId() : null)
                .courseId(enrollment.getCourse() != null ? enrollment.getCourse().getId() : null)
                .enrolledAt(enrollment.getEnrolledAt())
                .enrolledStatus(enrollment.getEnrolledStatus())
                .grade(enrollment.getGrade())
                .build();
    }
}
