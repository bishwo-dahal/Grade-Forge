package com.grade.forge.assignment.dto;

import com.grade.forge.assignment.enums.SubmissionType;
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
public class AssignmentRequest {
    private Long courseId;
    private Long languageId;
    private String name;
    private String description;
    private Integer totalPoints;
    private SubmissionType submissionType;
    private LocalDateTime availableFrom;
    private LocalDateTime dueDate;
    private LocalDateTime lateDueDate;
    private Long rubricId;
    private Long mainGroupId;
}
