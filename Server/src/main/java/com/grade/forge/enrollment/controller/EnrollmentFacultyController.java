package com.grade.forge.enrollment.controller;


import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.enrollment.dto.EnrollmentRequest;
import com.grade.forge.enrollment.dto.EnrollmentResponse;
import com.grade.forge.enrollment.service.EnrollmentService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/faculty/enrollments")
public class EnrollmentFacultyController {

    private final EnrollmentService enrollmentService;
    private final ActivityLogService activityLogService;

// Single Enrollment
    @PostMapping
    public ResponseEntity<EnrollmentResponse> enrollStudent(Authentication authentication, @RequestBody EnrollmentRequest request) {
        try {
            EnrollmentResponse response = enrollmentService.enrollStudentInCourse(request.getStudentId(), request.getCourseId(), request.getCanvasId());
            activityLogService.log(authentication, "Enrolled student", "Student: " + response.getStudentName() + " in Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Enrolled student", "Student: " + request.getStudentId() + " in Course ID: " + request.getCourseId(), "failed");
            throw ex;
        }
    }


//    Bulk Enrollment
    @PostMapping("/bulk")
    public ResponseEntity<List<EnrollmentResponse>> enrollStudents(Authentication authentication,
                                                                   @RequestBody List<EnrollmentRequest> requests) {
        List<EnrollmentResponse> responses = new ArrayList<>();

        try {
            for (EnrollmentRequest request : requests) {
                EnrollmentResponse response = enrollmentService.enrollStudentInCourse(
                        request.getStudentId(),
                        request.getCourseId(),
                        request.getCanvasId()
                );
                responses.add(response);
            }

            activityLogService.log(authentication, "Bulk enrolled students", "Total students enrolled: " + responses.size(), "success");
            return new ResponseEntity<>(responses, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Bulk enrolled students", "Failed during bulk enrollment request", "failed");
            throw ex;
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentResponse>> getCourseEnrollments(@PathVariable Long courseId) {
        List<EnrollmentResponse> responses = enrollmentService.getCourseEnrollments(courseId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PatchMapping("/{studentId}/enroll/{courseId}")
    public ResponseEntity<EnrollmentResponse> approveCourse(Authentication authentication, @PathVariable Long studentId,
                                                            @PathVariable Long courseId) {
        try {
            EnrollmentResponse response = enrollmentService.enrollCurrentStudentFromCourse(studentId, courseId);
            activityLogService.log(authentication, "Approved enrollment", "Student: " + response.getStudentName() + " in Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Approved enrollment", "Student ID: " + studentId + " in Course ID: " + courseId, "failed");
            throw ex;
        }
    }

    @PatchMapping("/{studentId}/drop/{courseId}")
    public ResponseEntity<EnrollmentResponse> dropCourse(Authentication authentication, @PathVariable Long studentId,
                                                         @PathVariable Long courseId) {
        try {
            EnrollmentResponse response = enrollmentService.dropStudentFromCourse(studentId, courseId);
            activityLogService.log(authentication, "Dropped student", "Student: " + response.getStudentName() + " from Course: " + response.getCourseName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Dropped student", "Student ID: " + studentId + " from Course ID: " + courseId, "failed");
            throw ex;
        }
    }

}
