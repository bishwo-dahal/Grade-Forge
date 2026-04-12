package com.grade.forge.user.repository;

import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmail(String email);
    // NOTE: Faculty roster email lookup must be case-insensitive to match real-world email entry behavior.
    Optional<Users> findByEmailIgnoreCase(String email);
    // NOTE: Typeahead suggestions are prefix-based and scoped to student accounts for enrollment flow.
    List<Users> findTop8ByRoleAndEmailStartingWithIgnoreCase(Role role, String emailPrefix);
    // NOTE: Contains-based fallback catches valid emails when faculty does not type from character one.
    List<Users> findTop8ByRoleAndEmailContainingIgnoreCase(Role role, String emailPart);
}
