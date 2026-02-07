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
    private String message;
}

