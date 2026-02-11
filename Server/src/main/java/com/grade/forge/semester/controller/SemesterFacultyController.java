package com.grade.forge.semester.controller;


import com.grade.forge.semester.dto.SemesterResponseDto;
import com.grade.forge.semester.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/semester")
@RequiredArgsConstructor
public class SemesterFacultyController {

    private final SemesterService semesterService;


    @GetMapping("/all")
    public ResponseEntity<List<SemesterResponseDto>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }
}
