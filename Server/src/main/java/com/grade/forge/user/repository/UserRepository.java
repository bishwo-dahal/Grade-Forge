package com.grade.forge.user.repository;

import com.grade.forge.user.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmail(String email);
    // NOTE: Faculty roster email lookup must be case-insensitive to match real-world email entry behavior.
    Optional<Users> findByEmailIgnoreCase(String email);
}
