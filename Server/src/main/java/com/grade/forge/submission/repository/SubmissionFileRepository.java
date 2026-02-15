package com.grade.forge.submission.repository;

import com.grade.forge.submission.entity.SubmissionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubmissionFileRepository extends JpaRepository<SubmissionFile, Long> {
}

