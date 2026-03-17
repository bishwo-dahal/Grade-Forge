package com.grade.forge.grade_reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentGradeDTO {
    private Long assignmentId;
    private String assignmentName;
    private Double score;
    private Double maxScore;
    private String status;
}

