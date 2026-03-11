package com.grade.forge.execution.service;

import com.grade.forge.execution.dto.TestRunJobMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Producer for "run tests" jobs. Enqueues a message so the runner can pick it up.
 * Payload is {@link TestRunJobMessage} (JSON: {"testRunJobId": &lt;id&gt;}).
 */
@Service
public class ExecutionQueueService {

    private final RabbitTemplate rabbitTemplate;
    private final String queueName;

    public ExecutionQueueService(
            RabbitTemplate rabbitTemplate,
            @Value("${execution.queue.test-run-jobs}") String queueName) {
        this.rabbitTemplate = rabbitTemplate;
        this.queueName = queueName;
    }

    /**
     * Enqueue a test run job. The runner will consume this and execute tests for the given job.
     *
     * @param testRunJobId id of the existing TestRunJob (status should be QUEUED)
     */
    public void enqueueRunTests(Long testRunJobId) {
        rabbitTemplate.convertAndSend(queueName, new TestRunJobMessage(testRunJobId));
    }
}
