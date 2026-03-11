package com.grade.forge.execution.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.service.AssignmentService;
import com.grade.forge.coursemgmt.dto.CourseResponseDto;
import com.grade.forge.coursemgmt.service.CourseService;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
import com.grade.forge.execution.dto.TestCaseResultItem;
import com.grade.forge.execution.service.RunTestsSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Run tests by uploading current workspace files. No submission, no S3.
 * Files are kept temporarily on the server, tests run synchronously, result returned.
 */
@RestController
@RequestMapping("/api/v1/student/assignments")
@PreAuthorize("hasAuthority('STUDENT')")
@RequiredArgsConstructor
public class RunTestsStudentAssignmentController {

    private final RunTestsSyncService runTestsSyncService;
    private final AssignmentService assignmentService;
    private final CourseService courseService;

    @PostMapping(value = "/{assignmentId}/run-tests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestRunJobStatusResponse> runTestsWithFiles(
            @AuthenticationPrincipal CustomUserDetails user,
            @org.springframework.web.bind.annotation.PathVariable Long assignmentId,
            @RequestPart("files") List<MultipartFile> files) {
        ensureStudentCanAccessAssignment(user, assignmentId);
        TestRunJobStatusResponse result = runTestsSyncService.runTests(assignmentId, files);
        // Students should never see private tests; filter them out and recompute summary.
        List<TestCaseResultItem> publicResults = result.getResults() == null
                ? List.of()
                : result.getResults().stream()
                        .filter(r -> !Boolean.TRUE.equals(r.getIsPrivate()))
                        .toList();
        int passed = (int) publicResults.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
        TestRunJobStatusResponse safe = TestRunJobStatusResponse.builder()
                .id(result.getId())
                .submissionId(result.getSubmissionId())
                .status(result.getStatus())
                .createdAt(result.getCreatedAt())
                .startedAt(result.getStartedAt())
                .completedAt(result.getCompletedAt())
                .errorMessage(result.getErrorMessage())
                .results(publicResults)
                .passedCount(passed)
                .totalCount(publicResults.size())
                .build();
        return ResponseEntity.ok(safe);
    }

    /**
     * Ensure that the current student is actually enrolled in the course that owns this assignment.
     * Prevents students from running tests against arbitrary assignments.
     */
    private void ensureStudentCanAccessAssignment(CustomUserDetails user, Long assignmentId) {
        AssignmentResponse assignment = assignmentService.getAssignment(assignmentId);
        Long courseId = assignment.getCourseId();
        List<CourseResponseDto> courses = courseService.getCoursesForStudentEmail(user.getUsername());
        boolean allowed = courses.stream().anyMatch(c -> c.getId().equals(courseId));
        if (!allowed) {
            throw new IllegalArgumentException("You are not allowed to run tests for this assignment.");
        }
    }
}
