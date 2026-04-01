package com.grade.forge.coursemgmt.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.coursemgmt.dto.CourseRequestDto;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/courses")
@RequiredArgsConstructor
public class FacultyCourseController {


    private final CourseService courseService;
    private final ActivityLogService activityLogService;


    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CourseResponseDto> createCourse(Authentication authentication,
                                                          @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                          @RequestPart("course") CourseRequestDto courseRequestDto,
                                                          @RequestPart(value = "file", required = false) MultipartFile file) {
        CourseResponseDto createdCourse = courseService.createCourse(customUserDetails.getUsername(), courseRequestDto, file);
        activityLogService.log(authentication, "Created course", "Course: " + courseRequestDto.getName(), "success");
        return new ResponseEntity<>(createdCourse, HttpStatus.CREATED);
    }

    /**
     * Get a course by ID
     * @param id the course ID
     * @return the course
     */
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(Authentication authentication, @PathVariable Long id) {
        CourseResponseDto course = courseService.getCourseById(id);
        return new ResponseEntity<>(course, HttpStatus.OK);
    }



    /**
     * Get all courses for the authenticated faculty user
     */
    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getCoursesForCurrentUser(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<CourseResponseDto> courses = courseService.getCoursesByUserEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<List<CourseResponseDto>> getCoursesBySemester(Authentication authentication,
                                                                        @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                        @PathVariable Long semesterId) {
        List<CourseResponseDto> courses = courseService.getCoursesBySemesterForFaculty(customUserDetails.getUsername(), semesterId);
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    /**
     * Get all active courses
     * @return list of active courses
     */
    @GetMapping("/active")
    public ResponseEntity<List<CourseResponseDto>> getActiveCourses(Authentication authentication) {
        List<CourseResponseDto> courses = courseService.getActiveCourses();
        return new ResponseEntity<>(courses, HttpStatus.OK);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CourseResponseDto> updateCourse(Authentication authentication,
                                                          @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                          @PathVariable Long id,
                                                          @RequestPart("course") CourseRequestDto courseRequestDto,
                                                          @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            CourseResponseDto updatedCourse = courseService.updateCourse(id, courseRequestDto, customUserDetails.getUsername(), file);
            activityLogService.log(authentication, "Updated course", "Course: " + courseRequestDto.getName(), "success");
            return new ResponseEntity<>(updatedCourse, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated course", "Course: " + courseRequestDto.getName(), "failed");
            throw ex;
        }
    }

    /**
     * Disable a course (soft delete)
     * @param id the course ID
     * @return the disabled course
     */
    @PatchMapping("/disable/{id}")
    public ResponseEntity<CourseResponseDto> disableCourse(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                          @PathVariable Long id) {
        try {
            CourseResponseDto disabledCourse = courseService.disableCourseForFaculty(id, customUserDetails.getUsername());
            activityLogService.log(authentication, "Disabled course", "Course: " + disabledCourse.getName(), "success");
            return new ResponseEntity<>(disabledCourse, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Disabled course", "Course ID: " + id, "failed");
            throw ex;
        }
    }

    /**
     * Delete a course permanently
     * @param id the course ID
     * @return success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCourse(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails, @PathVariable Long id) {
        CourseResponseDto deleted = courseService.getCourseById(id);
        try {
            courseService.deleteCourseForFaculty(id, customUserDetails.getUsername());
            activityLogService.log(authentication, "Deleted course", "Course: " + (deleted != null ? deleted.getName() : ("ID " + id)), "success");
            return new ResponseEntity<>("Course deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted course", "Course: " + (deleted != null ? deleted.getName() : ("ID " + id)) + " failed: " + ex.getMessage(), "failed");
            throw ex;
        }
    }
    
    
    

}
