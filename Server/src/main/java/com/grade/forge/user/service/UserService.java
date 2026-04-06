package com.grade.forge.user.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.user.dto.UserProfilePictureResponse;
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

	@Override
	@Transactional(readOnly = true)
	public UserProfilePictureResponse getCurrentUserProfilePicture(String email) {
		Users user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

		UserProfilePicture picture = userProfilePictureRepository.findByUser_Id(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Profile picture not found for user email: " + email));
		return mapToResponse(picture);
	}

	@Override
	public void deleteCurrentUserProfilePicture(String email) {
		Users user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

		UserProfilePicture picture = userProfilePictureRepository.findByUser_Id(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Profile picture not found for user email: " + email));

		fileStorageService.deleteObject(picture.getFileKey());
		userProfilePictureRepository.delete(picture);
		user.setProfilePicture(null);
		userRepository.save(user);
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
}
