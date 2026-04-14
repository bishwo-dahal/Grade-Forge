package com.grade.forge.coursemgmt.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.service.CourseService;
import com.grade.forge.enrollment.dto.EnrollmentResponse;
import com.grade.forge.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/classes")
@RequiredArgsConstructor
public class StudentClassController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getAllCourses(Authentication authentication) {
        List<CourseResponseDto> courses = courseService.getAllCourses();
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<CourseResponseDto> getCourseById(Authentication authentication, @PathVariable Long courseId) {
        CourseResponseDto course = courseService.getCourseById(courseId);
        return new ResponseEntity<>(course, HttpStatus.OK);
    }

    @GetMapping("/enrolled")
    public ResponseEntity<List<CourseResponseDto>> getEnrolledCourses(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<CourseResponseDto> courses = courseService.getCoursesForStudentEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    @GetMapping("/waitlisted")
    public ResponseEntity<List<EnrollmentResponse>> getWaitlistedCourses(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<EnrollmentResponse> waitlisted = enrollmentService.getCurrentStudentWaitlistedEnrollments(customUserDetails.getUsername());
        return new ResponseEntity<>(waitlisted, HttpStatus.OK);
    }

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<EnrollmentResponse> enrollInCourse(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.waitListCurrentStudentInCourse(customUserDetails.getUsername(), courseId);
        activityLogService.log(authentication, "Enrolled student", "Student: " + response.getStudentName() + " in Course: " + response.getCourseName(), "success");
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

}
