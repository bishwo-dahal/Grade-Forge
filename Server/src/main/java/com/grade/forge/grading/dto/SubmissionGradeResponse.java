package com.grade.forge.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionGradeResponse {
    private Long id;
    private Long submissionId;
    private Long rubricSubCriteriaId;
    private String rubricSubCriteriaDescription;
    private Long rubricCriteriaId;
    private String rubricCriteriaTitle;
    private Double awardedScore;
    private String feedback;
}

