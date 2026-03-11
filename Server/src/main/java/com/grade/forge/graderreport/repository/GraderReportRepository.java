package com.grade.forge.graderreport.repository;

import com.grade.forge.graderreport.entity.GraderReport;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GraderReportRepository extends JpaRepository<GraderReport, Long> {

    List<GraderReport> findByAssignment_IdOrderByGeneratedAtDesc(Long assignmentId, Pageable pageable);

    Optional<GraderReport> findFirstByAssignment_IdOrderByGeneratedAtDesc(Long assignmentId);
}
