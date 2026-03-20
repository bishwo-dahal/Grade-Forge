package com.grade.forge.group.controller;

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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/courses/{courseId}/groups")
@RequiredArgsConstructor
public class FacultyGroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<MainGroupResponse> createMainGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId,
                                                             @RequestBody MainGroupRequest request) {
        MainGroupResponse response = groupService.createMainGroup(customUserDetails.getUsername(), courseId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{mainGroupId}")
    public ResponseEntity<MainGroupResponse> updateMainGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                             @PathVariable Long courseId,
                                                             @PathVariable Long mainGroupId,
                                                             @RequestBody MainGroupRequest request) {
        MainGroupResponse response = groupService.updateMainGroup(customUserDetails.getUsername(), courseId, mainGroupId, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{mainGroupId}/subgroups")
    public ResponseEntity<SubGroupResponse> createSubGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                           @PathVariable Long courseId,
                                                           @PathVariable Long mainGroupId,
                                                           @RequestBody SubGroupRequest request) {
        SubGroupResponse response = groupService.createSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{mainGroupId}/subgroups/{subGroupId}")
    public ResponseEntity<SubGroupResponse> updateSubGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                           @PathVariable Long courseId,
                                                           @PathVariable Long mainGroupId,
                                                           @PathVariable Long subGroupId,
                                                           @RequestBody SubGroupRequest request) {
        SubGroupResponse response = groupService.updateSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{mainGroupId}/subgroups/{subGroupId}/students")
    public ResponseEntity<SubGroupResponse> addStudentToSubGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                 @PathVariable Long courseId,
                                                                 @PathVariable Long mainGroupId,
                                                                 @PathVariable Long subGroupId,
                                                                 @RequestBody AddStudentToSubGroupRequest request) {
        SubGroupResponse response = groupService.addStudentToSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{mainGroupId}/subgroups/{subGroupId}/students/{studentId}")
    public ResponseEntity<SubGroupResponse> removeStudentFromSubGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                      @PathVariable Long courseId,
                                                                      @PathVariable Long mainGroupId,
                                                                      @PathVariable Long subGroupId,
                                                                      @PathVariable Long studentId) {
        SubGroupResponse response = groupService.removeStudentFromSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId, studentId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<MainGroupResponse>> listCourseGroups(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                    @PathVariable Long courseId) {
        List<MainGroupResponse> response = groupService.listCourseGroupsForFaculty(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{mainGroupId}")
    public ResponseEntity<String> deleteMainGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                  @PathVariable Long courseId,
                                                  @PathVariable Long mainGroupId) {
        groupService.deleteMainGroup(customUserDetails.getUsername(), courseId, mainGroupId);
        return new ResponseEntity<>("Main group deleted successfully", HttpStatus.OK);
    }

    @DeleteMapping("/{mainGroupId}/subgroups/{subGroupId}")
    public ResponseEntity<String> deleteSubGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                 @PathVariable Long courseId,
                                                 @PathVariable Long mainGroupId,
                                                 @PathVariable Long subGroupId) {
        groupService.deleteSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, subGroupId);
        return new ResponseEntity<>("Sub group deleted successfully", HttpStatus.OK);
    }
}


