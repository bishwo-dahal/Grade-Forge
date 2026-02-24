package com.grade.forge.search.controller;

import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.search.service.FacultySearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search/faculties")
@RequiredArgsConstructor
public class FacultySearchController {

    private final FacultySearchService facultySearchService;

    @GetMapping
    public List<FacultyResponse> search(@RequestParam("keyword") String keyword) {
        return facultySearchService.search(keyword);
    }
}

