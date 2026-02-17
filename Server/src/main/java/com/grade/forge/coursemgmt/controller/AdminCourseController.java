package com.grade.forge.coursemgmt.controller;


import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.service.CourseService;
import com.grade.forge.configuration.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/faculty/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;

    /**
     * Get all courses
     * @return list of all courses
     */
    @GetMapping("/getAll")
    public ResponseEntity<List<CourseResponseDto>> getAllCourses(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<CourseResponseDto> courses = courseService.getAllCourses();
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Get courses by faculty id
     */
    @GetMapping("/user/{facultyId}")
    public ResponseEntity<List<CourseResponseDto>> getCoursesByFaculty(@PathVariable Long facultyId) {
        List<CourseResponseDto> courses = courseService.getCoursesByFacultyId(facultyId);
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Disable a course (soft delete)
     * @param id the course ID
     * @return the disabled course
     */
    @PatchMapping("/disable/{id}")
    public ResponseEntity<CourseResponseDto> disableCourse(@PathVariable Long id) {
        CourseResponseDto disabledCourse = courseService.disableCourse(id);
        return new ResponseEntity<>(disabledCourse, HttpStatus.OK);
    }

    /**
     * Delete a course permanently
     * @param id the course ID
     * @return success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return new ResponseEntity<>("Course deleted successfully", HttpStatus.OK);
    }





}
