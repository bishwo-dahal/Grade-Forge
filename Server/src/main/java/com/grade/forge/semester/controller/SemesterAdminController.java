package com.grade.forge.semester.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.semester.dto.SemesterRequestDto;
import com.grade.forge.semester.dto.SemesterResponseDto;
import com.grade.forge.semester.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/semester")
@RequiredArgsConstructor
public class SemesterAdminController {

    private final SemesterService semesterService;
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<SemesterResponseDto> createSemester(Authentication authentication, @RequestBody SemesterRequestDto requestDto) {
        try {
            SemesterResponseDto response = semesterService.createSemester(requestDto);
            activityLogService.log(authentication, "Created semester", "Semester: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created semester", "Semester creation failed: " + requestDto.getName(), "failed");
            throw ex;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SemesterResponseDto> getSemester(Authentication authentication, @PathVariable Long id) {
        SemesterResponseDto response = semesterService.getSemester(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<SemesterResponseDto>> getAllSemesters(Authentication authentication) {
        List<SemesterResponseDto> response = semesterService.getAllSemesters();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SemesterResponseDto> updateSemester(Authentication authentication, @PathVariable Long id, @RequestBody SemesterRequestDto requestDto) {
        try {
            SemesterResponseDto response = semesterService.updateSemester(id, requestDto);
            activityLogService.log(authentication, "Updated semester", "Semester: " + response.getName(), "success");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated semester", "Semester update failed for ID: " + id, "failed");
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSemester(Authentication authentication, @PathVariable Long id) {
        SemesterResponseDto existing = semesterService.getSemester(id);
        try {
            semesterService.deleteSemester(id);
            activityLogService.log(authentication, "Deleted semester", "Semester: " + (existing != null ? existing.getName() : ("ID " + id)), "success");
            return new ResponseEntity<>("Semester deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted semester", "Semester delete failed for " + (existing != null ? existing.getName() : ("ID " + id)) + " error: " + ex.getMessage(), "failed");
            throw ex;
        }
    }
}

