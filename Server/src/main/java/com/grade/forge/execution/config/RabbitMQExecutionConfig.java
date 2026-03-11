package com.grade.forge.execution.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ config for the test-run job queue.
 * The same queue name must be used by the runner process when consuming.
 */
@Configuration
public class RabbitMQExecutionConfig {

    public static final String QUEUE_NAME_PROPERTY = "execution.queue.test-run-jobs";

    @Bean
    Queue testRunJobsQueue(@Value("${" + QUEUE_NAME_PROPERTY + "}") String queueName) {
        return new Queue(queueName, true);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
