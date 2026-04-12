package com.grade.forge.user.service;

import com.grade.forge.user.dto.UserProfilePictureResponse;
import com.grade.forge.user.dto.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserServiceInterface {

	UserProfilePictureResponse uploadCurrentUserProfilePicture(String email, MultipartFile file);


	UserProfileResponse patchCurrentUserProfile(String email, String name, MultipartFile file);
}
