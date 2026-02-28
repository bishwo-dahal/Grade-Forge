package com.grade.forge.gradingassistant.repository;

import com.grade.forge.gradingassistant.entity.GradingAssistant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GradingAssistantRepository extends JpaRepository<GradingAssistant, Long> {
    Optional<GradingAssistant> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}

