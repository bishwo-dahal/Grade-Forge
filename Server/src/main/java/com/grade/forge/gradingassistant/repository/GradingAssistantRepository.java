package com.grade.forge.gradingassistant.repository;

import com.grade.forge.gradingassistant.entity.GradingAssistant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradingAssistantRepository extends JpaRepository<GradingAssistant, Long> {
    Optional<GradingAssistant> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    List<GradingAssistant> findAllByFacultyId(Long facultyId);
    Optional<GradingAssistant> findByIdAndFacultyId(Long id, Long facultyId);
    List<GradingAssistant> findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(String name, String email, String department);
}
