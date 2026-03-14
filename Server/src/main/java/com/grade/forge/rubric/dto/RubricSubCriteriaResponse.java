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
public class RubricSubCriteriaResponse {
    private Long id;
    private String description;
    private Double maxScore;
    private Double weight;
}

