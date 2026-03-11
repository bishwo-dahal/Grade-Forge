package com.grade.forge.testsuite.repository;

import com.grade.forge.testsuite.entity.TestSuite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestSuiteRepository extends JpaRepository<TestSuite, Long> {
    Optional<TestSuite> findByAssignment_Id(Long assignmentId);
}
