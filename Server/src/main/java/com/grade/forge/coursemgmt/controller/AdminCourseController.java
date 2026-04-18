package com.grade.forge.coursemgmt.controller;


import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/university_admin/faculty/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;
    private final ActivityLogService activityLogService;

    /**
     * Get all courses
     * @return list of all courses
     */
    @GetMapping("/getAll")
    public ResponseEntity<List<CourseResponseDto>> getAllCourses(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<CourseResponseDto> courses = courseService.getAllCourses();
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Get courses by faculty id
     */
    @GetMapping("/user/{facultyId}")
    public ResponseEntity<List<CourseResponseDto>> getCoursesByFaculty(Authentication authentication, @PathVariable Long facultyId) {
        List<CourseResponseDto> courses = courseService.getCoursesByFacultyId(facultyId);
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Disable a course (soft delete)
     * @param id the course ID
     * @return the disabled course
     */
    @PatchMapping("/disable/{id}")
    public ResponseEntity<CourseResponseDto> disableCourse(Authentication authentication, @PathVariable Long id) {
        try {
            CourseResponseDto disabledCourse = courseService.disableCourse(id);
            activityLogService.log(authentication, "Disabled course", "Course: " + disabledCourse.getName(), "success");
            return new ResponseEntity<>(disabledCourse, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Disabled course", "Course ID: " + id + " failed: " + ex.getMessage(), "failed");
            throw ex;
        }
    }

    /**
     * Delete a course permanently
     * @param id the course ID
     * @return success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCourse(Authentication authentication, @PathVariable Long id) {
        CourseResponseDto deleted = courseService.getCourseById(id);
        try {
            courseService.deleteCourse(id);
            activityLogService.log(authentication, "Deleted course", "Course: " + (deleted != null ? deleted.getName() : ("ID " + id)), "success");
            return new ResponseEntity<>("Course deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted course", "Course: " + (deleted != null ? deleted.getName() : ("ID " + id)) + " failed: " + ex.getMessage(), "failed");
            throw ex;
        }
    }





}
