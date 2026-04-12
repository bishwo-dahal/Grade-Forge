package com.grade.forge.group.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.group.dto.AddStudentToSubGroupRequest;
import com.grade.forge.group.dto.MainGroupRequest;
import com.grade.forge.group.dto.MainGroupResponse;
import com.grade.forge.group.dto.SubGroupRequest;
import com.grade.forge.group.dto.SubGroupResponse;
import com.grade.forge.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/courses/{courseId}/groups")
@RequiredArgsConstructor
public class FacultyGroupController {

    private final GroupService groupService;
    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<MainGroupResponse> createMainGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId,
                                                             @RequestBody MainGroupRequest request) {
        try {
            MainGroupResponse response = groupService.createMainGroup(customUserDetails.getUsername(), courseId, request);
            activityLogService.log(authentication, "Created group", "Main group: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created group", "Course ID: " + courseId, "failed");
            throw ex;
        }
    }

    @PutMapping("/{mainGroupId}")
    public ResponseEntity<MainGroupResponse> updateMainGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId,
                                                             @PathVariable Long mainGroupId,
                                                             @RequestBody MainGroupRequest request) {
        try {
            MainGroupResponse response = groupService.updateMainGroup(customUserDetails.getUsername(), courseId, mainGroupId, request);
            activityLogService.log(authentication, "Updated group", "Main group: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated group", "Main group ID: " + mainGroupId, "failed");
            throw ex;
        }
    }

    @PostMapping("/{mainGroupId}/subgroups")
    public ResponseEntity<SubGroupResponse> createSubGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                           @PathVariable Long courseId,
                                                           @PathVariable Long mainGroupId,
                                                           @RequestBody SubGroupRequest request) {
        try {
            SubGroupResponse response = groupService.createSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, request);
            activityLogService.log(authentication, "Created subgroup", "Subgroup: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Created subgroup", "Main group ID: " + mainGroupId, "failed");
            throw ex;
        }
    }

    @PutMapping("/{mainGroupId}/subgroups/{subGroupId}")
    public ResponseEntity<SubGroupResponse> updateSubGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                           @PathVariable Long courseId,
                                                           @PathVariable Long mainGroupId,
                                                           @PathVariable Long subGroupId,
                                                           @RequestBody SubGroupRequest request) {
        try {
            SubGroupResponse response = groupService.updateSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId, request);
            activityLogService.log(authentication, "Updated subgroup", "Subgroup: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Updated subgroup", "Subgroup ID: " + subGroupId, "failed");
            throw ex;
        }
    }

    @PostMapping("/{mainGroupId}/subgroups/{subGroupId}/students")
    public ResponseEntity<SubGroupResponse> addStudentToSubGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                 @PathVariable Long courseId,
                                                                 @PathVariable Long mainGroupId,
                                                                 @PathVariable Long subGroupId,
                                                                 @RequestBody AddStudentToSubGroupRequest request) {
        try {
            SubGroupResponse response = groupService.addStudentToSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId, request);
            activityLogService.log(authentication, "Added student to subgroup", "Student added to Subgroup: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Added student to subgroup", "Subgroup ID: " + subGroupId, "failed");
            throw ex;
        }
    }

    @DeleteMapping("/{mainGroupId}/subgroups/{subGroupId}/students/{studentId}")
    public ResponseEntity<SubGroupResponse> removeStudentFromSubGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                      @PathVariable Long courseId,
                                                                      @PathVariable Long mainGroupId,
                                                                      @PathVariable Long subGroupId,
                                                                      @PathVariable Long studentId) {
        try {
            SubGroupResponse response = groupService.removeStudentFromSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId, studentId);
            activityLogService.log(authentication, "Removed student from subgroup", "Student removed from Subgroup: " + response.getName(), "success");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Removed student from subgroup", "Subgroup ID: " + subGroupId, "failed");
            throw ex;
        }
    }

    @GetMapping
    public ResponseEntity<List<MainGroupResponse>> listCourseGroups(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                    @PathVariable Long courseId) {
        List<MainGroupResponse> response = groupService.listCourseGroupsForFaculty(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{mainGroupId}")
    public ResponseEntity<String> deleteMainGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                  @PathVariable Long courseId,
                                                  @PathVariable Long mainGroupId) {
        try {
            groupService.deleteMainGroup(customUserDetails.getUsername(), courseId, mainGroupId);
            activityLogService.log(authentication, "Deleted group", "Main group removed", "success");
            return new ResponseEntity<>("Main group deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted group", "Main group removal failed", "failed");
            throw ex;
        }
    }

    @DeleteMapping("/{mainGroupId}/subgroups/{subGroupId}")
    public ResponseEntity<String> deleteSubGroup(Authentication authentication, @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                 @PathVariable Long courseId,
                                                 @PathVariable Long mainGroupId,
                                                 @PathVariable Long subGroupId) {
        try {
            groupService.deleteSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId);
            activityLogService.log(authentication, "Deleted subgroup", "Subgroup removed", "success");
            return new ResponseEntity<>("Sub group deleted successfully", HttpStatus.OK);
        } catch (Exception ex) {
            activityLogService.log(authentication, "Deleted subgroup", "Subgroup removal failed", "failed");
            throw ex;
        }
    }
}


