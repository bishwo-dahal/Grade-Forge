package com.grade.forge.rubric.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
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
    @JsonSetter(nulls = Nulls.SKIP)
    private double points;
    private List<RubricSubCriteriaRequest> subCriteria;
}

