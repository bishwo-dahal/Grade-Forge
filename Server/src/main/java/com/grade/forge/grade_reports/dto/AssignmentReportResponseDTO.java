package com.grade.forge.grade_reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentReportResponseDTO {
    private Long courseId;
    private Long assignmentId;
    private String assignmentName;
    private List<StudentAssignmentStatusDTO> students;
}

