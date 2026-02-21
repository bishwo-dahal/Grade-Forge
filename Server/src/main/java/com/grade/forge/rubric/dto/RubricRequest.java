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
public class RubricRequest {
    private String name;
    private String description;
    private Long facultyId;
    private List<RubricCriteriaRequest> criteria;
}
