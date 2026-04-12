package com.grade.forge.coursemgmt.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.courseassistant.service.CourseAssistantService;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grading-assistant/courses")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('GRADING_ASSISTANT')")
public class GradingAssistantCourseController {

    private final CourseAssistantService courseAssistantService;

    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> listMyCourses(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<CourseResponseDto> courses = courseAssistantService.listCoursesForGradingAssistant(customUserDetails.getUserId());
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }
}

