package com.grade.forge.semester.controller;

import com.grade.forge.semester.dto.SemesterRequestDto;
import com.grade.forge.semester.dto.SemesterResponseDto;
import com.grade.forge.semester.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/semester")
@RequiredArgsConstructor
public class SemesterAdminController {

    private final SemesterService semesterService;

    @PostMapping
    public ResponseEntity<SemesterResponseDto> createSemester(@RequestBody SemesterRequestDto requestDto) {
        return new ResponseEntity<>(semesterService.createSemester(requestDto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SemesterResponseDto> getSemester(@PathVariable Long id) {
        return ResponseEntity.ok(semesterService.getSemester(id));
    }

    @GetMapping("/all")
    public ResponseEntity<List<SemesterResponseDto>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SemesterResponseDto> updateSemester(@PathVariable Long id, @RequestBody SemesterRequestDto requestDto) {
        return ResponseEntity.ok(semesterService.updateSemester(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSemester(@PathVariable Long id) {
        semesterService.deleteSemester(id);
        return new ResponseEntity<>("Semester deleted successfully", HttpStatus.OK);
    }
}

