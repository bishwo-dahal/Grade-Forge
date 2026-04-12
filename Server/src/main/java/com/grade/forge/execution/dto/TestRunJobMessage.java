package com.grade.forge.execution.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent to the test-run-jobs queue.
 * Consumer (runner) deserializes this and loads TestRunJob by id.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestRunJobMessage {
    private Long testRunJobId;
}
