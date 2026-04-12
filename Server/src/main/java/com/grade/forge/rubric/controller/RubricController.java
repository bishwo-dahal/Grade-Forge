package com.grade.forge.rubric.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.rubric.dto.RubricRequest;
import com.grade.forge.rubric.dto.RubricResponse;
import com.grade.forge.rubric.service.RubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/rubrics")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY')")
public class RubricController {

    private final RubricService rubricService;
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<RubricResponse> createRubric(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails, @RequestBody RubricRequest request) {
        try {
            RubricResponse response = rubricService.createRubric(request, customUserDetails.getUsername());
            activityLogService.log(authentication, "Created rubric", "Rubric: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created rubric", "Rubric creation failed: " + request.getName(), "failed");
            throw ex;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RubricResponse> updateRubric(Authentication authentication, @PathVariable Long id, @RequestBody RubricRequest request) {
        try {
            RubricResponse response = rubricService.updateRubric(id, request);
            activityLogService.log(authentication, "Updated rubric", "Rubric: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated rubric", "Rubric update failed for ID: " + id, "failed");
            throw ex;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RubricResponse> getRubric(Authentication authentication, @PathVariable Long id) {
        RubricResponse response = rubricService.getRubric(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRubric(Authentication authentication, @PathVariable Long id) {
        RubricResponse response = rubricService.getRubric(id);
        try {
            rubricService.deleteRubric(id);
            activityLogService.log(authentication, "Deleted rubric", "Rubric: " + (response != null ? response.getName() : ("ID " + id)), "success");
            return new ResponseEntity<>("Rubric deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted rubric", "Rubric delete failed for " + (response != null ? response.getName() : ("ID " + id)) + " error: " + ex.getMessage(), "failed");
            throw ex;
        }
    }

    @GetMapping("/faculty/me")
    public ResponseEntity<List<RubricResponse>> getRubricsForFaculty(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        List<RubricResponse> response = rubricService.getRubricByFacultyEmail(customUserDetails.getUsername());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
