package com.grade.forge.testsuite.service;

import com.grade.forge.testsuite.dto.TestCaseResponse;
import com.grade.forge.testsuite.dto.TestSuiteResponse;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.testsuite.entity.TestSuite;
import com.grade.forge.testsuite.repository.TestSuiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TestSuiteService {

    private final TestSuiteRepository testSuiteRepository;

    public Optional<TestSuiteResponse> getByAssignmentId(Long assignmentId) {
        return testSuiteRepository.findByAssignment_Id(assignmentId)
                .map(this::mapToResponse);
    }

    private TestSuiteResponse mapToResponse(TestSuite suite) {
        List<TestCaseResponse> cases = suite.getTestCases() == null
                ? List.of()
                : suite.getTestCases().stream()
                        .map(this::mapToTestCaseResponse)
                        .collect(Collectors.toList());
        return TestSuiteResponse.builder()
                .id(suite.getId())
                .title(suite.getTitle())
                .description(suite.getDescription())
                .assignmentId(suite.getAssignment().getId())
                .testCases(cases)
                .build();
    }

    private TestCaseResponse mapToTestCaseResponse(TestCase tc) {
        return TestCaseResponse.builder()
                .id(tc.getId())
                .title(tc.getTitle())
                .isPrivate(tc.getIsPrivate())
                .consoleInput(tc.getConsoleInput())
                .fileInput(tc.getFileInput())
                .output(tc.getOutput())
                .build();
    }
}
