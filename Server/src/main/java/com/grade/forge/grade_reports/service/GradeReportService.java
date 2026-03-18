package com.grade.forge.grade_reports.service;

import com.grade.forge.grade_reports.dto.AssignmentReportResponseDTO;
import com.grade.forge.grade_reports.dto.GradeReportResponseDTO;
import com.grade.forge.grade_reports.dto.StudentCourseStatsDTO;

import java.util.List;

public interface GradeReportService {
    GradeReportResponseDTO generateGradeReport(Long courseId, List<Long> studentIds, List<Long> assignmentIds);

    AssignmentReportResponseDTO generateAssignmentReport(Long courseId, Long assignmentId, List<Long> studentIds);

    StudentCourseStatsDTO generateStudentCourseStats(Long courseId, Long studentId);
}


