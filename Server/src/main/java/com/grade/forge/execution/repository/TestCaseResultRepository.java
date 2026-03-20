package com.grade.forge.execution.repository;

import com.grade.forge.execution.entity.TestCaseResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseResultRepository extends JpaRepository<TestCaseResult, Long> {

    List<TestCaseResult> findByTestRunJob_IdOrderById(Long testRunJobId);

    @Modifying
    void deleteByTestCase_IdIn(@Param("testCaseIds") List<Long> testCaseIds);
}
