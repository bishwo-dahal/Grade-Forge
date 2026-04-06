package com.grade.forge.user.service;

import com.grade.forge.user.dto.UserProfilePictureResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserServiceInterface {

	UserProfilePictureResponse uploadCurrentUserProfilePicture(String email, MultipartFile file);

	UserProfilePictureResponse getCurrentUserProfilePicture(String email);

	void deleteCurrentUserProfilePicture(String email);
}
