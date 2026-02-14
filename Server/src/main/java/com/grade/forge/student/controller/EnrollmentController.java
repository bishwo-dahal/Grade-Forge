package com.grade.forge.student.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/{courseId}")
    public ResponseEntity<EnrollmentResponse> enrollInCourse(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.enrollCurrentStudentInCourse(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{courseId}/drop")
    public ResponseEntity<EnrollmentResponse> dropCourse(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                         @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.dropCurrentStudentFromCourse(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> listEnrollments(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<EnrollmentResponse> responses = enrollmentService.getCurrentStudentEnrollments(customUserDetails.getUsername());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }



}
