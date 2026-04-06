package com.grade.forge.user.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.user.dto.UserProfilePictureResponse;
import com.grade.forge.user.dto.UserProfileResponse;
import com.grade.forge.user.entity.UserProfilePicture;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserProfilePictureRepository;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UserServiceInterface {

	private final UserRepository userRepository;
	private final UserProfilePictureRepository userProfilePictureRepository;
	private final FileStorageService fileStorageService;

	@Override
	public UserProfileResponse patchCurrentUserProfile(String email, String name, MultipartFile file) {
		Users user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

		if (name != null) {
			String normalizedName = name.trim();
			if (normalizedName.isBlank()) {
				throw new IllegalArgumentException("Name cannot be blank");
			}
			user.setName(normalizedName);
		}

		if (file != null && !file.isEmpty()) {
			replaceProfilePicture(user, file);
		}

		Users savedUser = userRepository.save(user);
		return mapToProfileResponse(savedUser);
	}

	@Override
	public UserProfilePictureResponse uploadCurrentUserProfilePicture(String email, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Profile picture file is required");
		}

		Users user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

		UserProfilePicture existing = userProfilePictureRepository.findByUser_Id(user.getId()).orElse(null);
		UserProfilePicture uploaded = fileStorageService.uploadUserProfilePicture(user, file);

		UserProfilePicture target;
		if (existing != null) {
			fileStorageService.deleteObject(existing.getFileKey());
			existing.setFileName(uploaded.getFileName());
			existing.setFileKey(uploaded.getFileKey());
			existing.setFileType(uploaded.getFileType());
			existing.setFileSize(uploaded.getFileSize());
			target = userProfilePictureRepository.save(existing);
		} else {
			target = userProfilePictureRepository.save(uploaded);
		}

		user.setProfilePicture(target);
		userRepository.save(user);
		return mapToResponse(target);
	}





	private UserProfilePictureResponse mapToResponse(UserProfilePicture picture) {
		return UserProfilePictureResponse.builder()
				.id(picture.getId())
				.fileName(picture.getFileName())
				.fileKey(picture.getFileKey())
				.fileType(picture.getFileType())
				.fileSize(picture.getFileSize())
				.downloadUrl(fileStorageService.generatePresignedDownloadUrl(picture.getFileKey(), picture.getFileName()))
				.build();
	}

	private void replaceProfilePicture(Users user, MultipartFile file) {
		UserProfilePicture existing = userProfilePictureRepository.findByUser_Id(user.getId()).orElse(null);
		UserProfilePicture uploaded = fileStorageService.uploadUserProfilePicture(user, file);

		if (existing != null) {
			fileStorageService.deleteObject(existing.getFileKey());
			user.setProfilePicture(null);
			userProfilePictureRepository.delete(existing);
			userProfilePictureRepository.flush();
		}

		UserProfilePicture latest = userProfilePictureRepository.save(uploaded);
		user.setProfilePicture(latest);
	}

	private UserProfileResponse mapToProfileResponse(Users user) {
		UserProfilePicture picture = userProfilePictureRepository.findByUser_Id(user.getId()).orElse(null);
		return UserProfileResponse.builder()
				.userId(user.getId())
				.name(user.getName())
				.email(user.getEmail())
				.role(user.getRole())
				.profilePicture(picture == null ? null : mapToResponse(picture))
				.build();
	}
}
