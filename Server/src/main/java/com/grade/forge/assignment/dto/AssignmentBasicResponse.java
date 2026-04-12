package com.grade.forge.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentBasicResponse {
    private Long id;
    private Long courseId;
    private String name;
    private String description;
    private Integer totalPoints;
    private LocalDateTime availableFrom;
    private LocalDateTime dueDate;
    private LocalDateTime lateDueDate;
    private String languageName;

}
