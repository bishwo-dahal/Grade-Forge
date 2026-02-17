package com.grade.forge.programminglanguage.repository;

import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgrammingLanguageRepository extends JpaRepository<ProgrammingLanguage, Long> {
    boolean existsByNameIgnoreCase(String name);
    Optional<ProgrammingLanguage> findByNameIgnoreCase(String name);
}

