package com.grade.forge.student.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.student.dto.StudentRequest;
import com.grade.forge.student.dto.StudentResponse;
import com.grade.forge.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(@RequestBody StudentRequest request) {
        System.out.println(request.getMajor());
        StudentResponse created = studentService.createStudent(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<StudentResponse> getStudent(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        StudentResponse response = studentService.getStudentByUserEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAllStudents() {
        List<StudentResponse> students = studentService.getAllStudents();
        return new ResponseEntity<>(students, HttpStatus.OK);
    }

    @PutMapping("/me")
    public ResponseEntity<StudentResponse> updateStudent(@AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody StudentRequest request) {
        StudentResponse updated = studentService.updateCurrentStudent(customUserDetails.getUsername(), request);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
