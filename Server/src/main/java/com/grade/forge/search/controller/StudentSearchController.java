package com.grade.forge.search.controller;

import com.grade.forge.search.dto.StudentSearchResponseDto;
import com.grade.forge.search.service.StudentSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search/students")
@RequiredArgsConstructor
public class StudentSearchController {

    private final StudentSearchService studentSearchService;

    @GetMapping
    public List<StudentSearchResponseDto> search(@RequestParam("keyword") String keyword, @RequestParam("courseId") Long courseId) {
        return studentSearchService.search(keyword, courseId);
    }

    @GetMapping("/plain")
    public List<StudentSearchResponseDto> searchPlain(@RequestParam("keyword") String keyword) {
        return studentSearchService.search(keyword);
    }
}
