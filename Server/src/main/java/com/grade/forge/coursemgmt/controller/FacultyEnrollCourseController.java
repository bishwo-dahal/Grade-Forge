package com.grade.forge.coursemgmt.controller;

import com.grade.forge.student.dto.EnrollmentRequest;
import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faculty/enrollments")
@RequiredArgsConstructor
public class FacultyEnrollCourseController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<EnrollmentResponse> enrollStudent(@RequestBody EnrollmentRequest request) {
        EnrollmentResponse response = enrollmentService.enrollStudentInCourse(request.getStudentId(), request.getCourseId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
