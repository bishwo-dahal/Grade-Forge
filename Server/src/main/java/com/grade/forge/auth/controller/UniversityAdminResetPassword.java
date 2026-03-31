package com.grade.forge.auth.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.auth.dto.PasswordResetRequest;
import com.grade.forge.auth.dto.response.AuthResponse;
import com.grade.forge.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/university-admin/reset-password")
@RequiredArgsConstructor
public class UniversityAdminResetPassword {

    private final AuthService authService;
    private final ActivityLogService activityLogService;

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(Authentication authentication, @RequestBody PasswordResetRequest resetRequest) {
        String userIdentifier = resetRequest != null ? resetRequest.getEmail() : "unknown";
        try {
            authService.resetPassword(resetRequest);
            activityLogService.log(authentication, "Password reset", "User: " + userIdentifier, "success");
            return ResponseEntity.ok("Reset Successful");
        } catch (Exception ex) {
            activityLogService.log(authentication, "Password reset", "User: " + userIdentifier, "failed");
            throw ex;
        }
    }
}
