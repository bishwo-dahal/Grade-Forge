package com.grade.forge.auth.dto.response;

import com.grade.forge.user.enums.Role;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String name;
    private Role role;
    // NOTE: Backend sends this flag so the app can decide if a student must complete registration before dashboard access.
    // IMPORTANT: Keep this backend-driven so behavior stays correct across sessions and devices.
    private boolean profileCompleted;
    private String message;
}

