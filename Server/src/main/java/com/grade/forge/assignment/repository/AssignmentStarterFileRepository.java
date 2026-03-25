package com.grade.forge.assignment.repository;

import com.grade.forge.assignment.entity.AssignmentStarterFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentStarterFileRepository extends JpaRepository<AssignmentStarterFile, Long> {
    List<AssignmentStarterFile> findByAssignment_Id(Long assignmentId);
    void deleteByAssignment_Id(Long assignmentId);
}

