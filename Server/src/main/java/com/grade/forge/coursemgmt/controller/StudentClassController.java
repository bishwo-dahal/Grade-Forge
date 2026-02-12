package com.grade.forge.coursemgmt.controller;

import com.grade.forge.coursemgmt.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/classes")
@RequiredArgsConstructor
public class StudentClassController {

    private final CourseService courseService;

}

