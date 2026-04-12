package com.grade.forge.semester.repository;

import com.grade.forge.semester.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByNameIgnoreCase(String name);
}
