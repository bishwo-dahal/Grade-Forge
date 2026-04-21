package com.grade.forge.user.service;

import com.grade.forge.user.dto.UserProfilePictureResponse;
import com.grade.forge.user.dto.UserProfileResponse;
import com.grade.forge.user.dto.UserPreferencesRequest;
import com.grade.forge.user.dto.UserPreferencesResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserServiceInterface {

	UserProfilePictureResponse uploadCurrentUserProfilePicture(String email, MultipartFile file);

	UserPreferencesResponse getCurrentUserPreferences(String email);

	UserPreferencesResponse putCurrentUserPreferences(String email, UserPreferencesRequest request);

	UserProfileResponse patchCurrentUserProfile(String email, String name, MultipartFile file);
}
