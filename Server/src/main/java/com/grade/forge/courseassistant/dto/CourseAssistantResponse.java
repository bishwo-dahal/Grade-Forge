package com.grade.forge.courseassistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseAssistantResponse {
    private Long id;
    private Long courseId;
    private String courseName;
    private Long gradingAssistantId;
    private String gradingAssistantName;
    private String gradingAssistantEmail;
    private LocalDateTime assignedAt;
}

