package com.grade.forge.coursemgmt.controller;

import com.grade.forge.coursemgmt.dto.CourseRequestDto;
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
@RequestMapping("/api/v1/faculty/courses")
@RequiredArgsConstructor
public class FacultyCourseController {


    private final CourseService courseService;

    /**
     * Create a new course
     * @param courseRequestDto the course request DTO
     * @return the created course
     */
    @PostMapping("/create")
    public ResponseEntity<CourseResponseDto> createCourse(@AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody CourseRequestDto courseRequestDto) {
        CourseResponseDto createdCourse = courseService.createCourse(customUserDetails.getUsername(), courseRequestDto);
        return new ResponseEntity<>(createdCourse, HttpStatus.CREATED);
    }

    /**
     * Get a course by ID
     * @param id the course ID
     * @return the course
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(@PathVariable Long id) {
        CourseResponseDto course = courseService.getCourseById(id);
        return new ResponseEntity<>(course, HttpStatus.OK);
    }



    /**
     * Get all courses for the authenticated faculty user
     */
    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getCoursesForCurrentUser(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<CourseResponseDto> courses = courseService.getCoursesByUserEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Get all active courses
     * @return list of active courses
     */
    @GetMapping("/active")
    public ResponseEntity<List<CourseResponseDto>> getActiveCourses() {
        List<CourseResponseDto> courses = courseService.getActiveCourses();
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Update an existing course
     * @param id the course ID
     * @param courseRequestDto the updated course request DTO
     * @return the updated course
     */
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponseDto> updateCourse(@PathVariable Long id, @RequestBody CourseRequestDto courseRequestDto) {
        CourseResponseDto updatedCourse = courseService.updateCourse(id, courseRequestDto);
        return new ResponseEntity<>(updatedCourse, HttpStatus.OK);
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
    public ResponseEntity<String> deleteCourse(@AuthenticationPrincipal CustomUserDetails customUserDetails, @PathVariable Long id) {
        courseService.deleteCourseForFaculty(id, customUserDetails.getUsername());
        return new ResponseEntity<>("Course deleted successfully", HttpStatus.OK);
    }

}
