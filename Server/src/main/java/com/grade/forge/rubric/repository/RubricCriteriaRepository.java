package com.grade.forge.rubric.repository;

import com.grade.forge.rubric.entity.RubricCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RubricCriteriaRepository extends JpaRepository<RubricCriteria, Long> {
}

