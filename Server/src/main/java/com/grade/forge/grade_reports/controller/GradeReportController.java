package com.grade.forge.grade_reports.controller;

import com.grade.forge.grade_reports.dto.AssignmentReportResponseDTO;
import com.grade.forge.grade_reports.dto.GradeReportResponseDTO;
import com.grade.forge.grade_reports.dto.StudentCourseStatsDTO;
import com.grade.forge.grade_reports.service.GradeReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty/courses/{courseId}/grade-report")
@RequiredArgsConstructor
public class GradeReportController {

    private final GradeReportService gradeReportService;

    @GetMapping
    public ResponseEntity<GradeReportResponseDTO> getGradeReport(@PathVariable Long courseId,
                                                                 @RequestParam(value = "studentIds", required = false) List<Long> studentIds,
                                                                 @RequestParam(value = "assignmentIds", required = false) List<Long> assignmentIds) {
        GradeReportResponseDTO response = gradeReportService.generateGradeReport(courseId, studentIds, assignmentIds);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assignments/{assignmentId}")
    public ResponseEntity<AssignmentReportResponseDTO> getAssignmentReport(@PathVariable Long courseId,
                                                                           @PathVariable Long assignmentId,
                                                                           @RequestParam(value = "studentIds", required = false) List<Long> studentIds) {
        AssignmentReportResponseDTO response = gradeReportService.generateAssignmentReport(courseId, assignmentId, studentIds);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/students/{studentId}/stats")
    public ResponseEntity<StudentCourseStatsDTO> getStudentCourseStats(@PathVariable Long courseId,
                                                                       @PathVariable Long studentId) {
        StudentCourseStatsDTO response = gradeReportService.generateStudentCourseStats(courseId, studentId);
        return ResponseEntity.ok(response);
    }
}


