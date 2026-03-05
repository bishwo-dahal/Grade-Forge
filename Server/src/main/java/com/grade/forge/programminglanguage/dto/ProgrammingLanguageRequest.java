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
public class ProgrammingLanguageRequest {
    private String name;
    private String dockerImage;
    /** Optional. Template may use {{main_file}} and {{main_class}} (runner substitutes at execution). */
    private String compileCommand;
    private String executionCode;
    private Boolean isActive;
    /** Optional comma-separated list of allowed source extensions (e.g. ".py,.txt,.csv"). */
    private String allowedExtensions;
}

