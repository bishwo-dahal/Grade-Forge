package com.grade.forge.rubric.dto;

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
public class RubricCriteriaResponse {
    private Long id;
    private String title;
    private String description;
    private Integer maxScore;
    private Double weight;
}

