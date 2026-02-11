package com.grade.forge.faculty.controller;

import com.grade.forge.faculty.dto.FacultyCreateRequest;
import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.service.FacultyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/university_admin/faculty")
public class FacultyAdminController {


    private final FacultyService facultyService;

    public FacultyAdminController(FacultyService facultyService) {
        this.facultyService = facultyService;
    }

    @PostMapping("/create")
    public ResponseEntity<FacultyResponse> createFaculty(@RequestBody FacultyCreateRequest facultyCreateRequest) {
        FacultyResponse createdFaculty = facultyService.createFaculty(facultyCreateRequest);
        return new ResponseEntity<>(createdFaculty, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacultyResponse> getFacultyById(@PathVariable Long id) {
        FacultyResponse faculty = facultyService.getFacultyById(id);
        return new ResponseEntity<>(faculty, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacultyResponse> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        FacultyResponse updatedFaculty = facultyService.updateFaculty(id, faculty);
        return new ResponseEntity<>(updatedFaculty, HttpStatus.OK);
    }

    @PatchMapping("/disable/{id}")
    public ResponseEntity<FacultyResponse> disableFaculty(@PathVariable Long id) {
        FacultyResponse disabledFaculty = facultyService.disableFaculty(id);
        return new ResponseEntity<>(disabledFaculty, HttpStatus.OK);
    }


    @GetMapping("/department/{department}")
    public ResponseEntity<List<FacultyResponse>> getAllFacultyByDepartment(@PathVariable String department) {
        List<FacultyResponse> faculties = facultyService.getAllFacultyByDepartment(department);
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @GetMapping("/active")
    public ResponseEntity<List<FacultyResponse>> getAllActiveFaculty() {
        List<FacultyResponse> faculties = facultyService.getAllActiveFaculty();
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFaculty(@PathVariable Long id) {
        facultyService.deleteFaculty(id);
        return new ResponseEntity<>("Faculty deleted successfully", HttpStatus.OK);
    }
}

