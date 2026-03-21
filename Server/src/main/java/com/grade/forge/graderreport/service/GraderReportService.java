package com.grade.forge.graderreport.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.graderreport.dto.GraderReportResponse;
import com.grade.forge.graderreport.entity.GraderReport;
import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.enums.GraderReportTriggerType;
import com.grade.forge.graderreport.repository.GraderReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Faculty-facing service for grader reports: request generation and get latest.
 */
@Service
@RequiredArgsConstructor
public class GraderReportService {

    private final GraderReportRepository graderReportRepository;
    private final AssignmentRepository assignmentRepository;
    private final FacultyRepository facultyRepository;
    private final GraderReportQueueService graderReportQueueService;

    /**
     * Ensure the faculty member (by email) teaches the course that owns this assignment.
     */
    public void ensureFacultyCanAccessAssignment(String facultyEmail, Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));
        if (!assignment.getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to access grader reports for this assignment.");
        }
    }

    /**
     * Create a grader report (MANUAL, PENDING), enqueue it, and return the response.
     * Caller must have verified faculty access to the assignment.
     */
    @Transactional
    public GraderReportResponse requestReport(String facultyEmail, Long assignmentId) {
        ensureFacultyCanAccessAssignment(facultyEmail, assignmentId);
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        GraderReport report = new GraderReport();
        report.setAssignment(assignment);
        report.setTriggerType(GraderReportTriggerType.MANUAL);
        report.setStatus(GraderReportStatus.PENDING);
        report = graderReportRepository.save(report);

        graderReportQueueService.enqueueGraderReport(report.getId());

        return toResponse(report);
    }

    /**
     * Get the latest grader report for the assignment, or throw if none.
     */
    @Transactional(readOnly = true)
    public GraderReportResponse getLatestReport(String facultyEmail, Long assignmentId) {
        ensureFacultyCanAccessAssignment(facultyEmail, assignmentId);
        GraderReport report = graderReportRepository.findFirstByAssignment_IdOrderByGeneratedAtDesc(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No grader report found for this assignment."));
        return toResponse(report);
    }

    /**
     * Get the latest grader report if present; otherwise null (for polling without 404).
     */
    @Transactional(readOnly = true)
    public GraderReportResponse getLatestReportIfPresent(String facultyEmail, Long assignmentId) {
        ensureFacultyCanAccessAssignment(facultyEmail, assignmentId);
        return graderReportRepository.findFirstByAssignment_IdOrderByGeneratedAtDesc(assignmentId)
                .map(this::toResponse)
                .orElse(null);
    }

    private GraderReportResponse toResponse(GraderReport report) {
        return GraderReportResponse.builder()
                .id(report.getId())
                .assignmentId(report.getAssignment().getId())
                .generatedAt(report.getGeneratedAt())
                .triggerType(report.getTriggerType())
                .status(report.getStatus())
                .errorMessage(report.getErrorMessage())
                .result(report.getResultJson())
                .build();
    }
}
