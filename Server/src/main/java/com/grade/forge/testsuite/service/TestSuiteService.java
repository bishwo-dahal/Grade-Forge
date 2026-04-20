package com.grade.forge.testsuite.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.testsuite.dto.TestCaseRequest;
import com.grade.forge.testsuite.dto.TestCaseResponse;
import com.grade.forge.testsuite.dto.TestSuiteRequest;
import com.grade.forge.testsuite.dto.TestSuiteResponse;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.testsuite.entity.TestSuite;
import com.grade.forge.testsuite.repository.TestSuiteRepository;
import com.grade.forge.coursemgmt.service.CourseSectionSyncService;
import com.grade.forge.execution.repository.TestCaseResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TestSuiteService {

    private final TestSuiteRepository testSuiteRepository;
    private final AssignmentRepository assignmentRepository;
    private final CourseSectionSyncService courseSectionSyncService;
    private final TestCaseResultRepository testCaseResultRepository;

    public Optional<TestSuiteResponse> getByAssignmentId(Long assignmentId) {
        return testSuiteRepository.findByAssignment_Id(assignmentId)
                .map(this::mapToResponse);
    }

    /**
     * Student-facing view of a test suite. Only returns public test cases and never exposes
     * any private test cases (or their expected outputs).
     */
    public Optional<TestSuiteResponse> getStudentVisibleByAssignmentId(Long assignmentId) {
        return testSuiteRepository.findByAssignment_Id(assignmentId)
                .map(suite -> {
                    List<TestCaseResponse> publicCases = suite.getTestCases() == null
                            ? List.of()
                            : suite.getTestCases().stream()
                                    .filter(tc -> !Boolean.TRUE.equals(tc.getIsPrivate()))
                                    .map(tc -> TestCaseResponse.builder()
                                            .id(tc.getId())
                                            .title(tc.getTitle())
                                            // Student API never marks cases as private; these are all public.
                                            .isPrivate(false)
                                            .input(tc.getInput())
                                            .fileName(tc.getFileName())
                                            .output(tc.getOutput())
                                            .build())
                                    .collect(Collectors.toList());
                    return TestSuiteResponse.builder()
                            .id(suite.getId())
                            .title(suite.getTitle())
                            .description(suite.getDescription())
                            .assignmentId(suite.getAssignment().getId())
                            .testCases(publicCases)
                            .build();
                });
    }

    @Transactional
    public TestSuiteResponse create(String facultyEmail, Long assignmentId, TestSuiteRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));
        assertCanManageTestSuiteForAssignment(assignment, facultyEmail);
        if (testSuiteRepository.findByAssignment_Id(assignmentId).isPresent()) {
            throw new IllegalArgumentException("Test suite already exists for this assignment");
        }
        TestSuite suite = new TestSuite();
        suite.setTitle(request.getTitle() != null ? request.getTitle() : "Test Suite");
        suite.setDescription(request.getDescription());
        suite.setAssignment(assignment);
        List<TestCase> cases = mapToTestCases(request.getTestCases(), suite);
        suite.setTestCases(cases);
        TestSuite saved = testSuiteRepository.save(suite);
        courseSectionSyncService.syncParentTestSuiteToSections(assignmentId);
        return mapToResponse(saved);
    }

    @Transactional
    public TestSuiteResponse update(String facultyEmail, Long assignmentId, TestSuiteRequest request) {
        TestSuite suite = testSuiteRepository.findByAssignment_Id(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Test suite not found for assignment id: " + assignmentId));
        assertCanManageTestSuiteForAssignment(suite.getAssignment(), facultyEmail);
        suite.setTitle(request.getTitle() != null ? request.getTitle() : suite.getTitle());
        suite.setDescription(request.getDescription());

        // IMPORTANT: Existing test runs/results may reference old test case IDs.
        // Clearing the collection deletes those test cases (orphanRemoval), which would violate FK constraints.
        List<Long> existingCaseIds = suite.getTestCases() == null
                ? List.of()
                : suite.getTestCases().stream()
                .map(TestCase::getId)
                .filter(id -> id != null && id > 0)
                .toList();
        if (!existingCaseIds.isEmpty()) {
            testCaseResultRepository.deleteByTestCase_IdIn(existingCaseIds);
        }

        suite.getTestCases().clear();
        List<TestCase> cases = mapToTestCases(request.getTestCases(), suite);
        suite.getTestCases().addAll(cases);
        TestSuite saved = testSuiteRepository.save(suite);
        courseSectionSyncService.syncParentTestSuiteToSections(assignmentId);
        return mapToResponse(saved);
    }

    private void assertCanManageTestSuiteForAssignment(Assignment assignment, String facultyEmail) {
        if (!assignment.getCourse().getFaculty().getEmail().equalsIgnoreCase(facultyEmail)) {
            throw new IllegalArgumentException("You are not allowed to manage test suite for this assignment");
        }
        if (assignment.getSourceAssignment() != null && Boolean.TRUE.equals(assignment.getInheritSyncEnabled())) {
            throw new IllegalArgumentException(
                    "This assignment is synced from the main course. Edit tests on the main course, or detach sync on this copy first.");
        }
    }

    private List<TestCase> mapToTestCases(List<TestCaseRequest> requests, TestSuite suite) {
        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }
        return requests.stream()
                .map(req -> {
                    TestCase tc = new TestCase();
                    tc.setTestSuite(suite);
                    tc.setTitle(req.getTitle() != null ? req.getTitle() : "");
                    tc.setIsPrivate(Boolean.TRUE.equals(req.getIsPrivate()));
                    tc.setInput(req.getInput());
                    tc.setFileName(req.getFileName());
                    tc.setOutput(req.getOutput() != null ? req.getOutput() : "");
                    return tc;
                })
                .collect(Collectors.toList());
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
                .input(tc.getInput())
                .fileName(tc.getFileName())
                .output(tc.getOutput())
                .build();
    }
}
