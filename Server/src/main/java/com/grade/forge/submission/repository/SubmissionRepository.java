package com.grade.forge.submission.repository;

import com.grade.forge.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignment_Id(Long courseId);
    List<Submission> findByAssignment_IdAndStudent_Id(Long assignmentId, Long studentId);
}
