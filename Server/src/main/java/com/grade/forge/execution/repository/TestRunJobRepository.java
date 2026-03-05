package com.grade.forge.execution.repository;

import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.enums.TestRunJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRunJobRepository extends JpaRepository<TestRunJob, Long> {

    List<TestRunJob> findBySubmission_IdOrderByCreatedAtDesc(Long submissionId);
}
