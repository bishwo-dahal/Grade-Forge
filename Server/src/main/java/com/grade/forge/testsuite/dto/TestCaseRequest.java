package com.grade.forge.testsuite.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseRequest {
    private String title;
    private Boolean isPrivate;
    private String input;
    private String fileName;
    private String output;
}
