package com.grade.forge.student.repository;

import com.grade.forge.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByCwid(String cwid);
    Optional<Student> findByCwid(String cwid);
    Optional<Student> findByUserId(Long userId);
    // NOTE: Faculty roster flow resolves student profile from email during lookup and enroll actions.
    Optional<Student> findByUser_EmailIgnoreCase(String email);
    // NOTE: Prefix suggestions from student profiles help when user.role data is inconsistent in legacy rows.
    List<Student> findTop8ByUser_EmailStartingWithIgnoreCase(String emailPrefix);
    // NOTE: Contains fallback supports google-like discovery when query is from the middle of the email.
    List<Student> findTop8ByUser_EmailContainingIgnoreCase(String emailPart);
}

