package com.grade.forge.faculty.repository;

import com.grade.forge.faculty.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByEmail(String email);
    Optional<Faculty> findByEmailIgnoreCase(String email);
    List<Faculty> findByDepartment(String department);
    List<Faculty> findByActive(boolean active);
    Optional<Faculty> findByUser_Id(Long userId);
}
