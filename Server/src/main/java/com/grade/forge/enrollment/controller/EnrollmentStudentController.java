package com.grade.forge.enrollment.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.enrollment.dto.EnrollmentResponse;
import com.grade.forge.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/enrollments")
@RequiredArgsConstructor
public class EnrollmentStudentController {

    private final EnrollmentService enrollmentService;
    private final ActivityLogService activityLogService;

    @PostMapping("/{courseId}")
    public ResponseEntity<EnrollmentResponse> waitListInCourse(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId) {
        try {
            EnrollmentResponse response = enrollmentService.waitListCurrentStudentInCourse(customUserDetails.getUsername(), courseId);
            activityLogService.log(authentication, "Enrolled student", "Student: " + response.getStudentName() + " waitlisted Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Enrolled student", "Student: " + customUserDetails.getUsername() + " waitlisted Course ID: " + courseId, "failed");
            throw ex;
        }
    }

    @PatchMapping("/{courseId}/drop")
    public ResponseEntity<EnrollmentResponse> dropCourse(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                         @PathVariable Long courseId) {
        try {
            EnrollmentResponse response = enrollmentService.dropCurrentStudentFromCourse(customUserDetails.getUsername(), courseId);
            activityLogService.log(authentication, "Dropped student", "Student: " + response.getStudentName() + " from Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Dropped student", "Student: " + customUserDetails.getUsername() + " from Course ID: " + courseId, "failed");
            throw ex;
        }
    }

    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> listEnrollments(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<EnrollmentResponse> responses = enrollmentService.getCurrentStudentEnrollments(customUserDetails.getUsername());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }



}
