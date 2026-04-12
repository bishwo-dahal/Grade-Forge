package com.grade.forge.testsuite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSuiteResponse {
    private Long id;
    private String title;
    private String description;
    private Long assignmentId;
    private List<TestCaseResponse> testCases;
}
