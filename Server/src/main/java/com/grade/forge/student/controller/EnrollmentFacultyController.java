package com.grade.forge.student.controller;


import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.service.EnrollmentService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/faculty/enrollments")
public class EnrollmentFacultyController {

    private EnrollmentService enrollmentService;


    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentResponse>> getCourseEnrollments(@PathVariable Long courseId) {
        List<EnrollmentResponse> responses = enrollmentService.getCourseEnrollments(courseId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PatchMapping("/{studentId}/enroll/{courseId}")
    public ResponseEntity<EnrollmentResponse> approveCourse(@PathVariable Long studentId,
                                                            @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.enrollCurrentStudentFromCourse(studentId, courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/{studentId}/drop/{courseId}")
    public ResponseEntity<EnrollmentResponse> dropCourse(@PathVariable Long studentId,
                                                         @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.dropStudentFromCourse(studentId, courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
