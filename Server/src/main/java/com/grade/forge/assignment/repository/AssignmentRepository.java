package com.grade.forge.assignment.repository;

import com.grade.forge.assignment.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourse_Id(Long courseId);
    Optional<Assignment> findByCourse_IdAndNameIgnoreCase(Long courseId, String name);
}
