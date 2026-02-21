package com.grade.forge.rubric.repository;

import com.grade.forge.rubric.entity.Rubric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RubricRepository extends JpaRepository<Rubric, Long> {
    Optional<Rubric> findByFaculty_Id(Long facultyId);
}
