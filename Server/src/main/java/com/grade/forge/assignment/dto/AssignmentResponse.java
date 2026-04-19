package com.grade.forge.assignment.dto;

import com.grade.forge.assignment.enums.SubmissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponse {
    private Long id;
    private Long courseId;
    private String courseName;
    private Long languageId;
    private String languageName;
    /**
     * Optional comma-separated list of allowed source extensions for this assignment's language
     * (e.g. ".py,.txt,.csv"). Mirrors ProgrammingLanguage.allowedExtensions for frontend validation.
     */
    private String languageAllowedExtensions;
    private String name;
    private String description;
    private Integer totalPoints;
    private SubmissionType submissionType;
    private List<AssignmentStarterFileResponse> starterCodeFiles;
    private LocalDateTime availableFrom;
    private LocalDateTime dueDate;
    private LocalDateTime lateDueDate;
    private Long rubricId;
    private String rubricName;
    private Long mainGroupId;
    private String mainGroupName;
    /** Parent assignment id when this row is a synced section copy. */
    private Long sourceAssignmentId;
    private Boolean inheritSyncEnabled;
    private LocalDateTime lastInheritedAt;
}
