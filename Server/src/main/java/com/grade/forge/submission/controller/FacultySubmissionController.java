package com.grade.forge.submission.controller;

import com.grade.forge.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faculty/submissions")
@RequiredArgsConstructor
public class FacultySubmissionController {

    private final SubmissionService submissionService;

}

