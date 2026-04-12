package com.grade.forge.auth.dto;

import com.grade.forge.user.enums.Role;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private Role role;
    // NOTE: Student registration metadata is captured during signup and persisted in Student entity.
    private String cwid;
    private String major;
    private String canvasUserId;
}

