package com.grade.forge.student.repository;

import com.grade.forge.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByCwid(String cwid);
    Optional<Student> findByCwid(String cwid);
    Optional<Student> findByUserId(Long userId);
    // NOTE: Faculty roster flow resolves student profile from email during lookup and enroll actions.
    Optional<Student> findByUser_EmailIgnoreCase(String email);
}

