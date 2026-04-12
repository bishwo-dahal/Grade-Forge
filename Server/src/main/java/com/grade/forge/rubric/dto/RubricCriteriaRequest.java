package com.grade.forge.rubric.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RubricCriteriaRequest {
    private String title;
    private Double points;
    private List<RubricSubCriteriaRequest> subCriteria;
}

