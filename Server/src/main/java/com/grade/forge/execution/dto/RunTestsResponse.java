package com.grade.forge.execution.dto;

import com.grade.forge.execution.enums.TestRunJobStatus;
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
public class RunTestsResponse {
    private Long testRunJobId;
    private Long submissionId;
    private TestRunJobStatus status;
}
