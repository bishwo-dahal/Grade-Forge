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
}

