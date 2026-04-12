package com.grade.forge.user.dto;

import com.grade.forge.user.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private UserProfilePictureResponse profilePicture;
}

