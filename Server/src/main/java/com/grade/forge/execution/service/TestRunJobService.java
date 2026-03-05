package com.grade.forge.execution.service;

import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.enums.TestRunJobStatus;
import com.grade.forge.execution.repository.TestRunJobRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates test run jobs for a submission. Before creating a new job, any existing
 * jobs for that submission are deleted so we only keep the latest run.
 */
@Service
@RequiredArgsConstructor
public class TestRunJobService {

    private final SubmissionRepository submissionRepository;
    private final TestRunJobRepository testRunJobRepository;
    private final ExecutionQueueService executionQueueService;

    /**
     * Request a test run for the given submission. Deletes any existing test run jobs
     * for this submission, then creates a new job (QUEUED) and enqueues it for the runner.
     *
     * @param submissionId the submission to run tests for
     * @return the new TestRunJob (status QUEUED)
     * @throws ResourceNotFoundException if submission not found
     * @throws IllegalArgumentException  if assignment has no test suite
     */
    @Transactional
    public TestRunJob requestRunTests(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (submission.getAssignment().getTestSuite() == null) {
            throw new IllegalArgumentException("Assignment has no test suite; cannot run tests.");
        }

        // Delete older runs for this submission so we only keep the latest
        testRunJobRepository.findBySubmission_IdOrderByCreatedAtDesc(submissionId)
                .forEach(testRunJobRepository::delete);

        TestRunJob job = new TestRunJob();
        job.setSubmission(submission);
        job.setStatus(TestRunJobStatus.QUEUED);
        job = testRunJobRepository.save(job);

        executionQueueService.enqueueRunTests(job.getId());
        return job;
    }
}
