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
    // NOTE: Student login/signup responses include completion status so frontend can enforce profile completion before dashboard access.
    private boolean profileCompleted;
    private String message;
}

