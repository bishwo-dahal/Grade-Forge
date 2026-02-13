package com.grade.forge.student.repository;

import com.grade.forge.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByCwid(String cwid);
    Optional<Student> findByCwid(String cwid);
    Optional<Student> findByUserId(Long userId);
}

