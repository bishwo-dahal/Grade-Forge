package com.grade.forge.university.repository;

import com.grade.forge.university.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface UniversityRepository extends JpaRepository<University, String> {

    Optional<University> findByName(String name);
}
