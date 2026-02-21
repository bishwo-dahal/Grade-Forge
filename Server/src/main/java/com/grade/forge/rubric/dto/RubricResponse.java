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
public class RubricResponse {
    private Long id;
    private String name;
    private String description;
    private Long facultyId;
    private List<RubricCriteriaResponse> criteria;
}
