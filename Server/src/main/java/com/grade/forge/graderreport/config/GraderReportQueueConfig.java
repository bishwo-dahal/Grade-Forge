package com.grade.forge.graderreport.config;

import org.springframework.amqp.core.Queue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ config for the grader-report job queue.
 * Same queue name is used by {@link com.grade.forge.graderreport.consumer.GraderReportConsumer}.
 */
@Configuration
public class GraderReportQueueConfig {

    public static final String QUEUE_NAME_PROPERTY = "execution.queue.grader-report-jobs";

    @Bean
    Queue graderReportJobsQueue(@Value("${" + QUEUE_NAME_PROPERTY + "}") String queueName) {
        return new Queue(queueName, true);
    }
}
