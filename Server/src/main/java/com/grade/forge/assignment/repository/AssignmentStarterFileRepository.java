package com.grade.forge.assignment.repository;

import com.grade.forge.assignment.entity.AssignmentStarterFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AssignmentStarterFileRepository extends JpaRepository<AssignmentStarterFile, Long> {
    List<AssignmentStarterFile> findByAssignment_Id(Long assignmentId);
    void deleteByAssignment_Id(Long assignmentId);

    /**
     * Hard-delete starter file rows not in {@code keepIds} for this assignment (ids are DB primary keys).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM AssignmentStarterFile f WHERE f.assignment.id = :assignmentId AND f.id NOT IN :keepIds")
    int deleteByAssignment_IdAndIdNotIn(
            @Param("assignmentId") Long assignmentId,
            @Param("keepIds") Collection<Long> keepIds);
}

