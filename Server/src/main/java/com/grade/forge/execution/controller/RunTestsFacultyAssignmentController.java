package com.grade.forge.execution.controller;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.execution.dto.TestRunJobStatusResponse;
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

/** Faculty: run tests by uploading current editor files. No submission, no S3. */
@RestController
@RequestMapping("/api/v1/faculty/assignments")
@PreAuthorize("hasAuthority('FACULTY')")
@RequiredArgsConstructor
public class RunTestsFacultyAssignmentController {

    private final RunTestsSyncService runTestsSyncService;

    @PostMapping(value = "/{assignmentId}/run-tests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestRunJobStatusResponse> runTestsWithFiles(
            @AuthenticationPrincipal CustomUserDetails user,
            @org.springframework.web.bind.annotation.PathVariable Long assignmentId,
            @RequestPart("files") List<MultipartFile> files) {
        TestRunJobStatusResponse result = runTestsSyncService.runTests(assignmentId, files);
        return ResponseEntity.ok(result);
    }
}
