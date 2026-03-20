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

    @PostMapping("/{mainGroupId}/subgroups")
    public ResponseEntity<SubGroupResponse> createSubGroup(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                           @PathVariable Long courseId,
                                                           @PathVariable Long mainGroupId,
                                                           @RequestBody SubGroupRequest request) {
        SubGroupResponse response = groupService.createSubGroup(customUserDetails.getUsername(), courseId, mainGroupId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
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

    @GetMapping
    public ResponseEntity<List<MainGroupResponse>> listCourseGroups(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                    @PathVariable Long courseId) {
        List<MainGroupResponse> response = groupService.listCourseGroupsForFaculty(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

