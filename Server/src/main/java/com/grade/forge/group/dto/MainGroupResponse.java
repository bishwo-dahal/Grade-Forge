package com.grade.forge.group.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class MainGroupResponse {
    private Long id;
    private String name;
    private List<SubGroupResponse> subGroups;
}

