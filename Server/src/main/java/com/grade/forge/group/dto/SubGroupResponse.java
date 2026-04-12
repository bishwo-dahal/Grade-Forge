package com.grade.forge.group.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class SubGroupResponse {
    private Long id;
    private String name;
    private List<GroupStudentResponse> students;
}

