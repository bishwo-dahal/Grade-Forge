package com.grade.forge.user.controller;

import com.grade.forge.audit.service.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.user.dto.UserProfileResponse;
import com.grade.forge.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ActivityLogService activityLogService;


//Update User Details
    @PatchMapping(value = "/me", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, "multipart/form-data;charset=UTF-8"})
    public ResponseEntity<UserProfileResponse> patchCurrentUser(Authentication authentication,
                                                                @AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                                @RequestPart(value = "name", required = false) String name,
                                                                @RequestPart(value = "file", required = false) MultipartFile file) {
        UserProfileResponse response = userService.patchCurrentUserProfile(customUserDetails.getUsername(), name, file);
        activityLogService.log(authentication, "Updated user profile", "User: " + customUserDetails.getUsername(), "success");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}


