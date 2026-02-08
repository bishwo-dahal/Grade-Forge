package com.grade.forge.classmgmt.controller;

import com.grade.forge.classmgmt.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/classes")
@RequiredArgsConstructor
public class StudentClassController {

    private final ClassService classService;

}

