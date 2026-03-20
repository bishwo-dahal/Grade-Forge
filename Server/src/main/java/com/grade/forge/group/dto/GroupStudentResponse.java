package com.grade.forge.group.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class GroupStudentResponse {
    private Long id;
    private String name;
    private String email;
}

