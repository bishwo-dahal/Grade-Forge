package com.grade.forge.auth.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grade.forge.auth.dto.LoginRequest;
import com.grade.forge.auth.dto.PasswordResetRequest;
import com.grade.forge.auth.dto.PasswordUpdateRequest;
import com.grade.forge.auth.dto.SignupRequest;
import com.grade.forge.auth.dto.response.AuthResponse;
import com.grade.forge.auth.service.AuthService;
import com.grade.forge.audit.ActivityLogService;
import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ActivityLogService activityLogService;
    private final ObjectMapper objectMapper;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(Authentication authentication, @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            System.out.println("Logged IN");
            Role resolvedRole = response.getRole() != null ? response.getRole() : authService.getRoleByEmail(loginRequest.getEmail());
            logActivity(authentication, resolvedRole, response.getEmail(), "User login", "User: " + loginRequest.getEmail(), "success");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logActivity(authentication, authService.getRoleByEmail(loginRequest.getEmail()), loginRequest.getEmail(), "User login", "User: " + loginRequest.getEmail(), "failed");
            throw ex;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication,
                                                       @AuthenticationPrincipal CustomUserDetails customUserDetails) {
        AuthResponse response = authService.getCurrentUserAuthResponse(customUserDetails.getUsername());
        return ResponseEntity.ok(response);
    }



    @PostMapping(value = "/signup", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> signup(Authentication authentication, @RequestBody SignupRequest signupRequest) {
        System.out.println(signupRequest.getEmail());
        log.info("signup email :{}", signupRequest.getEmail());
        try {
            AuthResponse response = authService.signup(signupRequest);
            logActivity(authentication, response.getRole(), response.getEmail(), "User signup", "User: " + signupRequest.getEmail(), "success");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception ex) {
            logActivity(authentication, null, signupRequest.getEmail(), "User signup", "User: " + signupRequest.getEmail(), "failed");
            throw ex;
        }
    }

    @PostMapping(value = "/signup", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, "multipart/form-data;charset=UTF-8"})
    public ResponseEntity<AuthResponse> signupWithProfilePicture(Authentication authentication,
                                                                 @RequestPart(value = "signupRequest", required = false) String signupRequestJson,
                                                                 @ModelAttribute SignupRequest formSignupRequest,
                                                                 @RequestPart(value = "file", required = false) MultipartFile file) {
        SignupRequest signupRequest = resolveSignupRequest(signupRequestJson, formSignupRequest);
        log.info("signup email :{}", signupRequest.getEmail());
        try {
            AuthResponse response = authService.signup(signupRequest, file);
            logActivity(authentication, response.getRole(), response.getEmail(), "User signup", "User: " + signupRequest.getEmail(), "success");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception ex) {
            logActivity(authentication, null, signupRequest.getEmail(), "User signup", "User: " + signupRequest.getEmail(), "failed");
            throw ex;
        }
    }

    private SignupRequest resolveSignupRequest(String signupRequestJson, SignupRequest formSignupRequest) {
        if (signupRequestJson != null && !signupRequestJson.isBlank()) {
            try {
                return objectMapper.readValue(signupRequestJson, SignupRequest.class);
            } catch (JsonProcessingException ex) {
                throw new IllegalArgumentException("Invalid signupRequest JSON payload");
            }
        }
        return formSignupRequest;
    }

    @PostMapping("/update-password")
    public ResponseEntity<AuthResponse> updatePassword(Authentication authentication, @RequestBody PasswordUpdateRequest updateRequest) {
        try {
            AuthResponse response = authService.updatePassword(updateRequest);
            logActivity(authentication, response.getRole(), response.getEmail(), "Password updated", "User: " + updateRequest.getEmail(), "success");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logActivity(authentication, null, updateRequest.getEmail(), "Password updated", "User: " + updateRequest.getEmail(), "failed");
            throw ex;
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(Authentication authentication, @RequestBody PasswordResetRequest resetRequest) {
        try {
            AuthResponse response = authService.resetPassword(resetRequest);
            logActivity(authentication, response.getRole(), response.getEmail(), "Password reset", "User: " + resetRequest.getEmail(), "success");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logActivity(authentication, null, resetRequest.getEmail(), "Password reset", "User: " + resetRequest.getEmail(), "failed");
            throw ex;
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Users> getUserById(Authentication authentication, @PathVariable Long userId) {
        try {
            Users user = authService.getUserById(userId);
            logActivity(authentication, null, user.getEmail(), "Fetched user", "User ID: " + userId, "success");
            return ResponseEntity.ok(user);
        } catch (Exception ex) {
            logActivity(authentication, null, null, "Fetched user", "User ID: " + userId, "failed");
            throw ex;
        }
    }

    @GetMapping("/user/email/{email}")
    public ResponseEntity<Users> getUserByEmail(Authentication authentication, @PathVariable String email) {
        try {
            Users user = authService.getUserByEmail(email);
            logActivity(authentication, null, email, "Fetched user by email", "Email: " + email, "success");
            return ResponseEntity.ok(user);
        } catch (Exception ex) {
            logActivity(authentication, null, email, "Fetched user by email", "Email: " + email, "failed");
            throw ex;
        }
    }

    private void logActivity(Authentication authentication, Role role, String userEmail, String action, String details, String status) {
        String resolvedRole = role != null ? role.name() : deriveRole(authentication);
        String resolvedUser = userEmail != null ? userEmail : deriveUser(authentication);
        activityLogService.log(resolvedRole != null ? resolvedRole : "unknown",
                resolvedUser != null ? resolvedUser : "anonymous",
                action,
                details,
                status);
    }

    private String deriveRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null || authentication.getAuthorities().isEmpty()) {
            return null;
        }
        return authentication.getAuthorities().iterator().next().getAuthority();
    }

    private String deriveUser(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        String name = authentication.getName();
        return (name != null && !"anonymousUser".equalsIgnoreCase(name)) ? name : null;
    }
}

