package com.grade.forge.execution.consumer;

import com.grade.forge.execution.dto.TestCaseResultItem;
import com.grade.forge.execution.dto.TestRunJobMessage;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.entity.TestCaseResult;
import com.grade.forge.execution.entity.TestRunJob;
import com.grade.forge.execution.enums.TestRunJobStatus;
import com.grade.forge.execution.repository.TestCaseResultRepository;
import com.grade.forge.execution.repository.TestRunJobRepository;
import com.grade.forge.execution.service.RunTestsSyncService;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.submission.entity.SubmissionFile;
import com.grade.forge.submission.repository.SubmissionFileRepository;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.testsuite.repository.TestCaseRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RabbitMQ consumer that executes queued test-run jobs.
 * Jobs are always run in Docker via {@link RunTestsSyncService}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TestRunJobConsumer {

    private final TestRunJobRepository testRunJobRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final FileStorageService fileStorageService;
    private final RunTestsSyncService runTestsSyncService;
    private final TestCaseResultRepository testCaseResultRepository;
    private final TestCaseRepository testCaseRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /** Guard against duplicate concurrent processing of the same job id. */
    private final ConcurrentHashMap<Long, Boolean> processing = new ConcurrentHashMap<>();

    @RabbitListener(queues = "${execution.queue.test-run-jobs}")
    @Transactional
    public void handleTestRunJob(TestRunJobMessage message) {
        Long jobId = message.getTestRunJobId();
        if (jobId == null) {
            log.warn("Received test-run message with null job id, ignoring");
            return;
        }

        if (processing.putIfAbsent(jobId, Boolean.TRUE) != null) {
            log.debug("Job {} is already being processed, skipping duplicate delivery", jobId);
            return;
        }

        try {
            processJob(jobId);
        } finally {
            processing.remove(jobId);
        }
    }

    private void processJob(Long jobId) {
        Optional<TestRunJob> jobOpt = testRunJobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            log.warn("TestRunJob {} not found; acknowledging message", jobId);
            return;
        }

        TestRunJob job = jobOpt.get();
        if (job.getStatus() != TestRunJobStatus.QUEUED) {
            log.debug("TestRunJob {} already in status {}, nothing to do", jobId, job.getStatus());
            return;
        }

        job.setStatus(TestRunJobStatus.RUNNING);
        job.setStartedAt(Instant.now());
        testRunJobRepository.save(job);

        try {
            List<SubmissionFile> submissionFiles =
                    submissionFileRepository.findBySubmission_IdOrderById(job.getSubmission().getId());
            if (submissionFiles.isEmpty()) {
                failJob(job, "Submission has no files.");
                return;
            }

            List<MultipartFile> multipartFiles = new ArrayList<>();
            for (SubmissionFile sf : submissionFiles) {
                byte[] content = fileStorageService.getFileContent(sf.getFileKey());
                multipartFiles.add(new ByteArrayMultipartFile(sf.getFileName(), sf.getFileType(), content));
            }

            Long assignmentId = job.getAssignment().getId();
            TestRunJobStatusResponse response = runTestsSyncService.runTests(assignmentId, multipartFiles, null);

            job.setStatus(response.getStatus() == TestRunJobStatus.COMPLETED
                    ? TestRunJobStatus.COMPLETED
                    : TestRunJobStatus.FAILED);
            job.setCompletedAt(Instant.now());
            job.setErrorMessage(response.getErrorMessage());
            testRunJobRepository.save(job);

            // Replace any previous results for this job.
            testCaseResultRepository.findByTestRunJob_IdOrderById(jobId)
                    .forEach(testCaseResultRepository::delete);
            entityManager.flush();

            if (response.getResults() != null) {
                for (TestCaseResultItem item : response.getResults()) {
                    if (item.getTestCaseId() == null) {
                        continue;
                    }
                    TestCase testCase = testCaseRepository.findById(item.getTestCaseId()).orElse(null);
                    if (testCase == null) {
                        continue;
                    }
                    TestCaseResult result = new TestCaseResult();
                    result.setTestRunJob(job);
                    result.setTestCase(testCase);
                    result.setPassed(Boolean.TRUE.equals(item.getPassed()));
                    result.setActualOutput(item.getActualOutput());
                    result.setTimedOut(Boolean.TRUE.equals(item.getTimedOut()));
                    result.setErrorMessage(item.getErrorMessage());
                    result.setRuntimeMs(item.getRuntimeMs());
                    testCaseResultRepository.save(result);
                }
            }

            entityManager.flush();
            log.info("TestRunJob {} finished with status {}", jobId, job.getStatus());
        } catch (Exception e) {
            log.warn("TestRunJob {} failed while running tests", jobId, e);
            failJob(job, e.getMessage());
        }
    }

    private void failJob(TestRunJob job, String message) {
        job.setStatus(TestRunJobStatus.FAILED);
        job.setCompletedAt(Instant.now());
        job.setErrorMessage(message);
        testRunJobRepository.save(job);
    }

    /**
     * Simple MultipartFile backed by a byte array, to avoid depending on test utilities.
     */
    private static final class ByteArrayMultipartFile implements MultipartFile {
        private final String originalFilename;
        private final String contentType;
        private final byte[] bytes;

        private ByteArrayMultipartFile(String originalFilename, String contentType, byte[] bytes) {
            this.originalFilename = originalFilename;
            this.contentType = contentType != null ? contentType : "application/octet-stream";
            this.bytes = bytes != null ? bytes : new byte[0];
        }

        @Override
        public String getName() {
            return originalFilename;
        }

        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return bytes.length == 0;
        }

        @Override
        public long getSize() {
            return bytes.length;
        }

        @Override
        public byte[] getBytes() {
            return bytes;
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(bytes);
        }

        @Override
        public void transferTo(File dest) throws IOException {
            Files.write(dest.toPath(), bytes);
        }
    }
}