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
public class AuthorshipTrainingRunResponse {

    private boolean success;
    private String message;
    private int labeledRowsTotal;
    private int rowsUsedForTraining;
    private int rowsSkippedNoGraderFeatures;
    private String modelOutputPath;
    /** Last lines of stderr when Python fails (truncated). */
    private String stderrTail;
}
