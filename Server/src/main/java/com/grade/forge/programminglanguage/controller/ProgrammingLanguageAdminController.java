package com.grade.forge.programminglanguage.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.programminglanguage.dto.ProgrammingLanguageRequest;
import com.grade.forge.programminglanguage.dto.ProgrammingLanguageResponse;
import com.grade.forge.programminglanguage.service.ProgrammingLanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/programming-languages")
@RequiredArgsConstructor
public class ProgrammingLanguageAdminController {

    private final ProgrammingLanguageService programmingLanguageService;
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<ProgrammingLanguageResponse> createProgrammingLanguage(Authentication authentication, @RequestBody ProgrammingLanguageRequest request) {
        try {
            ProgrammingLanguageResponse created = programmingLanguageService.createProgrammingLanguage(request);
            activityLogService.log(authentication, "Created programming language", "Language: " + created.getName(), "success");
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created programming language", "Language: " + request.getName(), "failed");
            throw ex;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProgrammingLanguageResponse> getProgrammingLanguage(@PathVariable Long id) {
        ProgrammingLanguageResponse response = programmingLanguageService.getProgrammingLanguage(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProgrammingLanguageResponse>> getAllProgrammingLanguages() {
        List<ProgrammingLanguageResponse> languages = programmingLanguageService.getAllProgrammingLanguages();
        return new ResponseEntity<>(languages, HttpStatus.OK);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProgrammingLanguageResponse>> getActiveProgrammingLanguages() {
        List<ProgrammingLanguageResponse> languages = programmingLanguageService.getActiveProgrammingLanguages();
        return new ResponseEntity<>(languages, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProgrammingLanguageResponse> updateProgrammingLanguage(Authentication authentication, @PathVariable Long id,
                                                                                 @RequestBody ProgrammingLanguageRequest request) {
        try {
            ProgrammingLanguageResponse updated = programmingLanguageService.updateProgrammingLanguage(id, request);
            activityLogService.log(authentication, "Updated programming language", "Language: " + updated.getName(), "success");
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated programming language", "Language ID: " + id, "failed");
            throw ex;
        }
    }

    @PatchMapping("/disable/{id}")
    public ResponseEntity<ProgrammingLanguageResponse> disableProgrammingLanguage(Authentication authentication, @PathVariable Long id) {
        try {
            ProgrammingLanguageResponse disabled = programmingLanguageService.disableProgrammingLanguage(id);
            activityLogService.log(authentication, "Disabled programming language", "Language: " + disabled.getName(), "success");
            return new ResponseEntity<>(disabled, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Disabled programming language", "Language ID: " + id, "failed");
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProgrammingLanguage(Authentication authentication, @PathVariable Long id) {
        try {
            ProgrammingLanguageResponse existing = programmingLanguageService.getProgrammingLanguage(id);
            programmingLanguageService.deleteProgrammingLanguage(id);
            activityLogService.log(authentication, "Deleted programming language", "Language: " + (existing != null ? existing.getName() : ("ID " + id)), "success");
            return new ResponseEntity<>("Programming language deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted programming language", "Language ID: " + id, "failed");
            throw ex;
        }
    }
}

