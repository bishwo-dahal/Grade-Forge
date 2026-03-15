package com.grade.forge.grade_reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeReportRequestDTO {
    private Long courseId;
    private List<Long> studentIds;
    private List<Long> assignmentIds;
}

