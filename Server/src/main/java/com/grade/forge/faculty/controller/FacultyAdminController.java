package com.grade.forge.faculty.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.faculty.dto.FacultyCreateRequest;
import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.service.FacultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/faculty")
@RequiredArgsConstructor
public class FacultyAdminController {

    private final FacultyService facultyService;
    private final ActivityLogService activityLogService;

    @PostMapping("/create")
    public ResponseEntity<FacultyResponse> createFaculty(Authentication authentication, @RequestBody FacultyCreateRequest facultyCreateRequest) {
        FacultyResponse createdFaculty = facultyService.createFaculty(facultyCreateRequest);
        activityLogService.log(authentication, "Added faculty", "Faculty: " + facultyCreateRequest.getName() + " - " + facultyCreateRequest.getEmail(), "success");
        return new ResponseEntity<>(createdFaculty, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacultyResponse> getFacultyById(Authentication authentication, @PathVariable Long id) {
        FacultyResponse faculty = facultyService.getFacultyById(id);
        return new ResponseEntity<>(faculty, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacultyResponse> updateFaculty(Authentication authentication, @PathVariable Long id, @RequestBody Faculty faculty) {
        FacultyResponse updatedFaculty = facultyService.updateFaculty(id, faculty);
        activityLogService.log(authentication, "Updated faculty", "Faculty: " + faculty.getName(), "success");
        return new ResponseEntity<>(updatedFaculty, HttpStatus.OK);
    }

    @PatchMapping("/disable/{id}")
    public ResponseEntity<FacultyResponse> disableFaculty(Authentication authentication, @PathVariable Long id) {
        FacultyResponse disabledFaculty = facultyService.disableFaculty(id);
        activityLogService.log(authentication, "Removed faculty", "Faculty ID: " + id, "success");
        return new ResponseEntity<>(disabledFaculty, HttpStatus.OK);
    }


    @GetMapping("/department/{department}")
    public ResponseEntity<List<FacultyResponse>> getAllFacultyByDepartment(Authentication authentication, @PathVariable String department) {
        List<FacultyResponse> faculties = facultyService.getAllFacultyByDepartment(department);
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @GetMapping("/all")
    public ResponseEntity<List<FacultyResponse>> getAllFaculty(Authentication authentication) {
        List<FacultyResponse> faculties = facultyService.getAllFaculty();
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @GetMapping("/active")
    public ResponseEntity<List<FacultyResponse>> getAllActiveFaculty(Authentication authentication) {
        List<FacultyResponse> faculties = facultyService.getAllActiveFaculty();
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFaculty(Authentication authentication, @PathVariable Long id) {
        facultyService.deleteFaculty(id);
        activityLogService.log(authentication, "Removed faculty", "Faculty ID: " + id, "success");
        return new ResponseEntity<>("Faculty deleted successfully", HttpStatus.OK);
    }
}

