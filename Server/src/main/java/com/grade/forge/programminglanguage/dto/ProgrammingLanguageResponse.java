package com.grade.forge.programminglanguage.dto;

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
public class ProgrammingLanguageResponse {
    private Long id;
    private String name;
    private String dockerImage;
    private String compileCommand;
    private String executionCode;
    private Boolean isActive;
}

