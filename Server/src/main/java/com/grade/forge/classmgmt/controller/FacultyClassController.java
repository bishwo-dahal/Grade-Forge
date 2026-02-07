package com.grade.forge.classmgmt.controller;

import com.grade.forge.classmgmt.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faculty/classes")
@RequiredArgsConstructor
public class FacultyClassController {

    private final ClassService classService;

}

