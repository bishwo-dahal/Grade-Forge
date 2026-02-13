package com.grade.forge.programminglanguage.controller;

import com.grade.forge.programminglanguage.dto.ProgrammingLanguageResponse;
import com.grade.forge.programminglanguage.service.ProgrammingLanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/programming-languages")
@RequiredArgsConstructor
public class ProgrammingLanguageFacultyController {

    private final ProgrammingLanguageService programmingLanguageService;

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
}
