
package com.grade.forge.grading.repository;

import com.grade.forge.grading.entity.SubmissionGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionGradeRepository extends JpaRepository<SubmissionGrade, Long> {
    List<SubmissionGrade> findBySubmission_Id(Long submissionId);
}

