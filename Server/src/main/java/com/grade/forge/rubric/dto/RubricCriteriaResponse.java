package com.grade.forge.rubric.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RubricCriteriaResponse {
    private Long id;
    private String title;
    private Integer points;
    private List<RubricSubCriteriaResponse> subCriteria;
}

