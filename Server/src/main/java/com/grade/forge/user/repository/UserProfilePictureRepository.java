package com.grade.forge.user.repository;

import com.grade.forge.user.entity.UserProfilePicture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfilePictureRepository extends JpaRepository<UserProfilePicture, Long> {
    Optional<UserProfilePicture> findByUser_Id(Long userId);
}

