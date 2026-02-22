package com.grade.forge.search.controller;

import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.search.service.CourseSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search/courses")
@RequiredArgsConstructor
public class CourseSearchController {

    private final CourseSearchService courseSearchService;

    @GetMapping
    public List<CourseResponseDto> search(@RequestParam("keyword") String keyword) {
        return courseSearchService.search(keyword);
    }
}

