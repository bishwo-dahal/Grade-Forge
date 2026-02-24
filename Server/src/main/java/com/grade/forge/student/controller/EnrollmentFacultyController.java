package com.grade.forge.student.controller;


import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.dto.FacultyEnrollByEmailRequest;
import com.grade.forge.student.dto.FacultyStudentEmailSuggestionResponse;
import com.grade.forge.student.dto.FacultyStudentLookupResponse;
import com.grade.forge.student.service.EnrollmentService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/faculty/enrollments")
public class EnrollmentFacultyController {

    private EnrollmentService enrollmentService;


    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentResponse>> getCourseEnrollments(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                         @PathVariable Long courseId) {
        // IMPORTANT: Use authenticated faculty email so course roster access is ownership-scoped.
        List<EnrollmentResponse> responses = enrollmentService.getCourseEnrollmentsForFaculty(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}/search-student")
    public ResponseEntity<FacultyStudentLookupResponse> searchStudentByEmail(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                             @PathVariable Long courseId,
                                                                             @RequestParam("email") String email) {
        FacultyStudentLookupResponse response = enrollmentService.searchStudentForFacultyCourse(customUserDetails.getUsername(), courseId, email);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/course/{courseId}/student-email-suggestions")
    public ResponseEntity<List<FacultyStudentEmailSuggestionResponse>> suggestStudentEmails(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                                             @PathVariable Long courseId,
                                                                                             @RequestParam("query") String query) {
        List<FacultyStudentEmailSuggestionResponse> suggestions = enrollmentService.suggestStudentEmailsForFacultyCourse(customUserDetails.getUsername(), courseId, query);
        return new ResponseEntity<>(suggestions, HttpStatus.OK);
    }

    @PostMapping("/course/{courseId}/enroll-by-email")
    public ResponseEntity<EnrollmentResponse> enrollStudentByEmail(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                   @PathVariable Long courseId,
                                                                   @RequestBody FacultyEnrollByEmailRequest request) {
        // FIX: Null-safe email extraction avoids controller-side NPE and lets service return validation errors consistently.
        String email = request == null ? null : request.getEmail();
        EnrollmentResponse response = enrollmentService.enrollStudentByEmailForFaculty(customUserDetails.getUsername(), courseId, email);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/{studentId}/enroll/{courseId}")
    public ResponseEntity<EnrollmentResponse> approveCourse(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                            @PathVariable Long studentId,
                                                            @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.enrollCurrentStudentFromCourse(customUserDetails.getUsername(), studentId, courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/{studentId}/drop/{courseId}")
    public ResponseEntity<EnrollmentResponse> dropCourse(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                         @PathVariable Long studentId,
                                                         @PathVariable Long courseId) {
        EnrollmentResponse response = enrollmentService.dropStudentFromCourse(customUserDetails.getUsername(), studentId, courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
