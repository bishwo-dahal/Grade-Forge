package com.grade.forge.rubric.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RubricCriteriaRequest {
    private String title;
    private String description;
    private Integer maxScore;
    private Double weight;
}

