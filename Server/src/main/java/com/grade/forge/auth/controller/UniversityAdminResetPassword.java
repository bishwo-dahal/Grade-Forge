package com.grade.forge.auth.controller;

import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.auth.dto.PasswordResetRequest;
import com.grade.forge.auth.dto.response.AuthResponse;
import com.grade.forge.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/university-admin/reset-password")
@RequiredArgsConstructor
public class UniversityAdminResetPassword {

    private final AuthService authService;
    private final ActivityLogService activityLogService;

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@RequestBody PasswordResetRequest resetRequest) {
        try {
            AuthResponse response = authService.resetPassword(resetRequest);
                 return ResponseEntity.ok(response);
        } catch (Exception ex) {
                 throw ex;
        }
    }
}
