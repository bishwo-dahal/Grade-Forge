package com.grade.forge.assignment.repository;

import com.grade.forge.assignment.entity.RubricItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RubricRepository extends JpaRepository<RubricItem, Long> {

}

