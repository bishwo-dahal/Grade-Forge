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
public class SubmissionGradeItemRequest {
    private Long rubricSubCriteriaId;
    private Double awardedScore;
    private String feedback;
}

