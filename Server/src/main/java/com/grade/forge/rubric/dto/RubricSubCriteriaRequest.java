package com.grade.forge.rubric.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RubricSubCriteriaRequest {
    private String description;
    private Integer maxScore;
    private Double weight;
}

