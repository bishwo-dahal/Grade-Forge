package com.grade.forge.grade_reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentGradeDTO {
    private Long studentId;
    private String studentName;
    private Double totalScore;
    private List<AssignmentGradeDTO> assignments;
}

