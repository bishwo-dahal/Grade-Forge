package com.grade.forge.group.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.group.dto.MainGroupResponse;
import com.grade.forge.group.dto.SubGroupResponse;
import com.grade.forge.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/courses/{courseId}/groups")
@RequiredArgsConstructor
public class StudentGroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<MainGroupResponse>> listCourseGroups(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                    @PathVariable Long courseId) {
        List<MainGroupResponse> response = groupService.listCourseGroupsForStudent(customUserDetails.getUsername(), courseId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/assignments/{assignmentId}")
    public ResponseEntity<SubGroupResponse> getAssignmentGroupForLoggedInStudent(
            @AuthenticationPrincipal CustomUserDetails customUserDetails,
            @PathVariable Long courseId,
            @PathVariable Long assignmentId) {
        SubGroupResponse response = groupService.getAssignmentGroupForStudent(
                customUserDetails.getUsername(),
                courseId,
                assignmentId
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }


}

