package com.grade.forge.faculty.controller;

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
    public ResponseEntity<Faculty> createFaculty(@RequestBody Faculty faculty) {
        Faculty createdFaculty = facultyService.createFaculty(faculty);
        return new ResponseEntity<>(createdFaculty, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Optional<Faculty>> getFacultyById(@PathVariable Long id) {
        Optional<Faculty> faculty = facultyService.getFacultyById(id);
        return new ResponseEntity<>(faculty, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        Faculty updatedFaculty = facultyService.updateFaculty(id, faculty);
        return new ResponseEntity<>(updatedFaculty, HttpStatus.OK);
    }

    @PatchMapping("/disable/{id}")
    public ResponseEntity<Faculty> disableFaculty(@PathVariable Long id) {
        Faculty disabledFaculty = facultyService.disableFaculty(id);
        return new ResponseEntity<>(disabledFaculty, HttpStatus.OK);
    }


    @GetMapping("/department/{department}")
    public ResponseEntity<List<Faculty>> getAllFacultyByDepartment(@PathVariable String department) {
        List<Faculty> faculties = facultyService.getAllFacultyByDepartment(department);
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Faculty>> getAllActiveFaculty() {
        List<Faculty> faculties = facultyService.getAllActiveFaculty();
        return new ResponseEntity<>(faculties, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFaculty(@PathVariable Long id) {
        facultyService.deleteFaculty(id);
        return new ResponseEntity<>("Faculty deleted successfully", HttpStatus.OK);
    }
}

