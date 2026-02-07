package com.grade.forge.auth.dto;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class PasswordResetRequest {
    private String email;
    private String resetToken;
    private String newPassword;
}

