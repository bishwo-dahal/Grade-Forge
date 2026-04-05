package com.grade.forge.submission.repository;

import com.grade.forge.submission.entity.SubmissionAuthorshipTriage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionAuthorshipTriageRepository extends JpaRepository<SubmissionAuthorshipTriage, Long> {

    Optional<SubmissionAuthorshipTriage> findBySubmission_IdAndFaculty_Id(Long submissionId, Long facultyId);

    List<SubmissionAuthorshipTriage> findBySubmission_Assignment_IdAndFaculty_Id(Long assignmentId, Long facultyId);
}
