package com.grade.forge.gradingassistant.dto;

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
public class GradingAssistantRequest {
    private String name;
    private String email;
    private String password;
    private String officeHours;
    private String department;
}

