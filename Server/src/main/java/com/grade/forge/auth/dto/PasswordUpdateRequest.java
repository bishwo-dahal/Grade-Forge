package com.grade.forge.auth.dto;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class PasswordUpdateRequest {
    private String email;
    private String oldPassword;
    private String newPassword;
}

