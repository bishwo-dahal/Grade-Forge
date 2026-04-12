package com.grade.forge.student.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.student.dto.StudentRequest;
import com.grade.forge.student.dto.StudentResponse;
import com.grade.forge.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(Authentication authentication, @RequestBody StudentRequest request) {
        System.out.println(request.getMajor());
        StudentResponse created = studentService.createStudent(request);
        activityLogService.log(authentication, "Enrolled student", "Student ID: " + created.getId(), "success");
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<StudentResponse> getStudent(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        StudentResponse response = studentService.getStudentByUserEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAllStudents(Authentication authentication) {
        List<StudentResponse> students = studentService.getAllStudents();
        return new ResponseEntity<>(students, HttpStatus.OK);
    }

    @PutMapping("/me")
    public ResponseEntity<StudentResponse> updateStudent(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody StudentRequest request) {
        StudentResponse updated = studentService.updateCurrentStudent(customUserDetails.getUsername(), request);
        activityLogService.log(authentication, "Updated student", "Student: " + customUserDetails.getUsername(), "success");
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @PutMapping("/me/complete-registration")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<StudentResponse> completeStudentRegistration(
            Authentication authentication,
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @RequestBody StudentRequest request
    ) {
        // NOTE: This endpoint finishes student registration after account creation.
        // IMPORTANT: It is separate from PUT /me so it also works when a student row does not exist yet.
        StudentResponse updated = studentService.completeCurrentStudentRegistration(customUserDetails.getUsername(), request);
        activityLogService.log(authentication, "Updated student", "Student: " + customUserDetails.getUsername(), "success");
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(Authentication authentication, @PathVariable Long id) {
        studentService.deleteStudent(id);
        activityLogService.log(authentication, "Removed student", "Student ID: " + id, "success");
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
