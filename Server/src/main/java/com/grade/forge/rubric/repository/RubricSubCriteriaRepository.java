package com.grade.forge.rubric.repository;

import com.grade.forge.rubric.entity.RubricSubCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RubricSubCriteriaRepository extends JpaRepository<RubricSubCriteria, Long> {
}