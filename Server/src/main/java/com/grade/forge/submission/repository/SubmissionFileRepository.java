package com.grade.forge.submission.repository;

import com.grade.forge.submission.entity.SubmissionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionFileRepository extends JpaRepository<SubmissionFile, Long> {

    List<SubmissionFile> findBySubmission_IdOrderById(Long submissionId);

    List<SubmissionFile> findBySubmission_IdIn(List<Long> submissionIds);

    void deleteBySubmission_IdIn(List<Long> submissionIds);
}

