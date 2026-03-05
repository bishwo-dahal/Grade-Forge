package com.grade.forge.execution.service;

import com.grade.forge.execution.dto.RunTestsResponse;
import com.grade.forge.execution.dto.TestCaseResultItem;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.entity.TestCaseResult;
import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.enums.TestRunJobStatus;
import com.grade.forge.execution.repository.TestCaseResultRepository;
import com.grade.forge.execution.repository.TestRunJobRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Creates test run jobs for a submission. Before creating a new job, any existing
 * jobs for that submission are deleted so we only keep the latest run.
 */
@Service
@RequiredArgsConstructor
public class TestRunJobService {

    private final SubmissionRepository submissionRepository;
    private final TestRunJobRepository testRunJobRepository;
    private final TestCaseResultRepository testCaseResultRepository;
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

    @Transactional(readOnly = true)
    public Optional<TestRunJob> getLatestBySubmissionId(Long submissionId) {
        return testRunJobRepository.findBySubmission_IdOrderByCreatedAtDesc(submissionId).stream().findFirst();
    }

    @Transactional(readOnly = true)
    public Optional<TestRunJob> findById(Long jobId) {
        return testRunJobRepository.findById(jobId);
    }

    public RunTestsResponse toRunTestsResponse(TestRunJob job) {
        return RunTestsResponse.builder()
                .testRunJobId(job.getId())
                .submissionId(job.getSubmission().getId())
                .status(job.getStatus())
                .build();
    }

    public TestRunJobStatusResponse toStatusResponse(TestRunJob job) {
        List<TestCaseResult> results = testCaseResultRepository.findByTestRunJob_IdOrderById(job.getId());
        List<TestCaseResultItem> items = results.stream()
                .map(this::toTestCaseResultItem)
                .collect(Collectors.toList());
        int passed = (int) items.stream().filter(i -> Boolean.TRUE.equals(i.getPassed())).count();
        return TestRunJobStatusResponse.builder()
                .id(job.getId())
                .submissionId(job.getSubmission().getId())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .errorMessage(job.getErrorMessage())
                .results(items)
                .passedCount(passed)
                .totalCount(items.size())
                .build();
    }

    private TestCaseResultItem toTestCaseResultItem(TestCaseResult r) {
        return TestCaseResultItem.builder()
                .testCaseId(r.getTestCase().getId())
                .testCaseTitle(r.getTestCase().getTitle())
                .passed(r.getPassed())
                .actualOutput(r.getActualOutput())
                .expectedOutput(r.getTestCase().getOutput())
                .timedOut(r.getTimedOut())
                .errorMessage(r.getErrorMessage())
                .runtimeMs(r.getRuntimeMs())
                .build();
    }
}
