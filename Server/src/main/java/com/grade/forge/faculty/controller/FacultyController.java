package com.grade.forge.faculty.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.dto.FacultyUpdateRequest;
import com.grade.forge.faculty.service.FacultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faculty")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class FacultyController {

    private final FacultyService facultyService;
    private final ActivityLogService activityLogService;

    @GetMapping("/me")
    public ResponseEntity<FacultyResponse> getCurrentFaculty(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        FacultyResponse response = facultyService.getFacultyByUserEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/me")
    public ResponseEntity<FacultyResponse> updateCurrentFaculty(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                @RequestBody FacultyUpdateRequest request) {
        FacultyResponse response = facultyService.updateCurrentFaculty(customUserDetails.getUsername(), request);
        activityLogService.log(authentication, "Updated faculty", "Faculty: " + response.getName(), "success");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
