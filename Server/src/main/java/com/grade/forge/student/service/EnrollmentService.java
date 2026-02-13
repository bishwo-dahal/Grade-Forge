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

    public EnrollmentResponse enrollStudentInCourse(Long studentId, Long courseId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
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

    public EnrollmentResponse dropStudentFromCourse(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + studentId + " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.DROPPED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsForStudent(Long studentId) {
        studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        return enrollmentRepository.findByStudent_Id(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

