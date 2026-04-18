package com.grade.forge.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorshipTrainingStatusResponse {

    public enum State {
        RUNNING,
        SUCCEEDED,
        FAILED
    }

    private String runId;
    private State state;
    /** Current step description while RUNNING; last message when terminal. */
    private String phase;

    private Boolean success;
    private String message;
    private Integer labeledRowsTotal;
    private Integer rowsUsedForTraining;
    private Integer rowsSkippedNoGraderFeatures;
    private String modelOutputPath;
    private String stderrTail;
}
