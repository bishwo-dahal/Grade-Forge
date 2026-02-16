package com.grade.forge.programminglanguage.controller;

import com.grade.forge.programminglanguage.dto.ProgrammingLanguageRequest;
import com.grade.forge.programminglanguage.dto.ProgrammingLanguageResponse;
import com.grade.forge.programminglanguage.service.ProgrammingLanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/programming-languages")
@RequiredArgsConstructor
public class ProgrammingLanguageAdminController {

    private final ProgrammingLanguageService programmingLanguageService;

    @PostMapping
    public ResponseEntity<ProgrammingLanguageResponse> createProgrammingLanguage(@RequestBody ProgrammingLanguageRequest request) {
        ProgrammingLanguageResponse created = programmingLanguageService.createProgrammingLanguage(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
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
    public ResponseEntity<ProgrammingLanguageResponse> updateProgrammingLanguage(@PathVariable Long id,
                                                                                  @RequestBody ProgrammingLanguageRequest request) {
        ProgrammingLanguageResponse updated = programmingLanguageService.updateProgrammingLanguage(id, request);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @PatchMapping("/disable/{id}")
    public ResponseEntity<ProgrammingLanguageResponse> disableProgrammingLanguage(@PathVariable Long id) {
        ProgrammingLanguageResponse disabled = programmingLanguageService.disableProgrammingLanguage(id);
        return new ResponseEntity<>(disabled, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProgrammingLanguage(@PathVariable Long id) {
        programmingLanguageService.deleteProgrammingLanguage(id);
        return new ResponseEntity<>("Programming language deleted successfully", HttpStatus.OK);
    }
}

