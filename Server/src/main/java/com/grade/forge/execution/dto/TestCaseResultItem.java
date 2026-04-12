package com.grade.forge.execution.dto;

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
public class TestCaseResultItem {
    private Long testCaseId;
    private String testCaseTitle;
    private Boolean passed;
    private String actualOutput;
    private String expectedOutput;
    private Boolean timedOut;
    private String errorMessage;
    private Long runtimeMs;
    private Boolean isPrivate;
}
