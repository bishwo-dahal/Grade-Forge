package com.grade.forge.execution.repository;

import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.enums.TestRunJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRunJobRepository extends JpaRepository<TestRunJob, Long> {

    List<TestRunJob> findBySubmission_IdOrderByCreatedAtDesc(Long submissionId);

    /** Latest run for this student on this assignment (e.g. for polling when run was done without a prior submission). */
    List<TestRunJob> findByAssignment_IdAndStudent_IdOrderByCreatedAtDesc(Long assignmentId, Long studentId);
}
