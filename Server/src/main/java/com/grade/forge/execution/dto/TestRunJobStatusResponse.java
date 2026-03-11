package com.grade.forge.execution.dto;

import com.grade.forge.execution.enums.TestRunJobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestRunJobStatusResponse {
    private Long id;
    private Long submissionId;
    private TestRunJobStatus status;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
    private String errorMessage;
    private List<TestCaseResultItem> results;
    private Integer passedCount;
    private Integer totalCount;
}
