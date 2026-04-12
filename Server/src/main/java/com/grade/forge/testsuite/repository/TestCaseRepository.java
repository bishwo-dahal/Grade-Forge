package com.grade.forge.testsuite.repository;

import com.grade.forge.testsuite.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByTestSuite_Id(Long testSuiteId);
}
