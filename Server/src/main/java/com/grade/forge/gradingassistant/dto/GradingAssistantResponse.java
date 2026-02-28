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
public class GradingAssistantResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String officeHours;
    private String department;
}

