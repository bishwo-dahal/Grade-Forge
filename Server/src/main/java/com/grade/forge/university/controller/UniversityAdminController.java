package com.grade.forge.university.controller;

import com.grade.forge.university.entity.University;
import com.grade.forge.university.service.UniversityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system_admin/university")
public class UniversityAdminController {

    private final UniversityService universityService;

    public UniversityAdminController(UniversityService universityService) {
        this.universityService = universityService;
    }

    @PostMapping("/create")
    public ResponseEntity<University> createUniversity(@RequestBody University university) {
        University createdUniversity = universityService.createUniversity(university);
        return new ResponseEntity<>(createdUniversity, HttpStatus.CREATED);
    }

    @PatchMapping("/disable/{name}")
    public ResponseEntity<University> disableUniversity(@PathVariable String name) {
        University disabledUniversity = universityService.disableUniversity(name);
        return new ResponseEntity<>(disabledUniversity, HttpStatus.OK);
    }
}
