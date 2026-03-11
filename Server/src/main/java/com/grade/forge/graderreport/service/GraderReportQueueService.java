package com.grade.forge.graderreport.service;

import com.grade.forge.graderreport.dto.GraderReportMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Producer for grader-report jobs. Enqueues a message so {@link com.grade.forge.graderreport.consumer.GraderReportConsumer} can run the pipeline.
 */
@Service
public class GraderReportQueueService {

    private final RabbitTemplate rabbitTemplate;
    private final String queueName;

    public GraderReportQueueService(
            RabbitTemplate rabbitTemplate,
            @Value("${execution.queue.grader-report-jobs}") String queueName) {
        this.rabbitTemplate = rabbitTemplate;
        this.queueName = queueName;
    }

    /**
     * Enqueue a grader report job. The consumer will run the grader pipeline and update the report.
     *
     * @param graderReportId id of the existing GraderReport (status should be PENDING)
     */
    public void enqueueGraderReport(Long graderReportId) {
        rabbitTemplate.convertAndSend(queueName, new GraderReportMessage(graderReportId));
    }
}
