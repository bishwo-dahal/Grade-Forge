package com.grade.forge.assignment.repository;

import com.grade.forge.assignment.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourse_Id(Long courseId);
    Optional<Assignment> findByCourse_IdAndNameIgnoreCase(Long courseId, String name);
    Optional<Assignment> findByIdAndCourse_Id(Long id, Long courseId);

    /**
     * Assignments whose effective deadline (lateDueDate if set, else dueDate) has passed.
     */
    @Query("SELECT a FROM Assignment a WHERE (a.lateDueDate IS NOT NULL AND a.lateDueDate < :now) OR (a.lateDueDate IS NULL AND a.dueDate IS NOT NULL AND a.dueDate < :now)")
    List<Assignment> findWithDeadlineBefore(@Param("now") LocalDateTime now);

    List<Assignment> findBySourceAssignment_Id(Long sourceAssignmentId);

    List<Assignment> findBySourceAssignment_IdAndInheritSyncEnabledIsTrue(Long sourceAssignmentId);

    Optional<Assignment> findByCourse_IdAndSourceAssignment_Id(Long courseId, Long sourceAssignmentId);

    long countByCourse_Id(Long courseId);
}
