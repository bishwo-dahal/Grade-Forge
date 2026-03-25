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

    /**
     * Delete only starter file rows for this assignment whose ids are explicitly unkept
     * (must belong to {@code assignmentId}; primary keys in {@code unkeptIds}).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM AssignmentStarterFile f WHERE f.assignment.id = :assignmentId AND f.id IN :unkeptIds")
    int deleteByAssignment_IdAndIdIn(
            @Param("assignmentId") Long assignmentId,
            @Param("unkeptIds") Collection<Long> unkeptIds);
}

