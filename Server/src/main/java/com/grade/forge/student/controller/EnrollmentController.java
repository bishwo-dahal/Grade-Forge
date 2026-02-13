package com.grade.forge.student.controller;

import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students/{studentId}/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/{courseId}")
    public ResponseEntity<EnrollmentResponse> enrollInCourse(@PathVariable Long studentId, @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.enrollStudentInCourse(studentId, courseId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{courseId}/drop")
    public ResponseEntity<EnrollmentResponse> dropCourse(@PathVariable Long studentId, @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.dropStudentFromCourse(studentId, courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> listEnrollments(@PathVariable Long studentId) {
        List<EnrollmentResponse> responses = enrollmentService.getEnrollmentsForStudent(studentId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }
}

