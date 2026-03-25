package com.grade.forge.university.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.university.entity.University;
import com.grade.forge.university.service.UniversityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system_admin/university")
@RequiredArgsConstructor
public class UniversityAdminController {

    private final UniversityService universityService;
    private final ActivityLogService activityLogService;

    @PostMapping("/create")
    public ResponseEntity<University> createUniversity(Authentication authentication, @RequestBody University university) {
        try {
            University createdUniversity = universityService.createUniversity(university);
            activityLogService.log(authentication, "Created university", "University: " + createdUniversity.getName(), "success");
            return new ResponseEntity<>(createdUniversity, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created university", "University: " + university.getName(), "failed");
            throw ex;
        }
    }

    @PatchMapping("/disable/{name}")
    public ResponseEntity<University> disableUniversity(Authentication authentication, @PathVariable String name) {
        try {
            University disabledUniversity = universityService.disableUniversity(name);
            activityLogService.log(authentication, "Disabled university", "University: " + name, "success");
            return new ResponseEntity<>(disabledUniversity, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Disabled university", "University: " + name, "failed");
            throw ex;
        }
    }
}
