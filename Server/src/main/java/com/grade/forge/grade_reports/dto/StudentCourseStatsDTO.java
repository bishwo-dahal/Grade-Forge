package com.grade.forge.grade_reports.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentCourseStatsDTO {
    private Long courseId;
    private Long studentId;
    private String studentName;

    private Integer totalAssignments;
    private Integer submittedAssignments;
    private Integer gradedAssignments;
    private Integer missingAssignments;
    private Integer lateSubmissions;

    /** 0-100 rounded to nearest int. */
    private Integer submissionRatePercent;

    /** Overall percent (0-100) using graded-only by default. */
    private Integer overallPercentGradedOnly;

    /** Overall percent (0-100) counting missing/ungraded as 0. */
    private Integer overallPercentIncludingMissing;

    private LastActivityDTO lastActivity;
    private List<TrendPointDTO> trend;

    /** Placeholder flags until integrity pipeline is wired. */
    private Integer plagiarismFlagCount;
    /** Placeholder minutes until time-on-task tracking is wired. */
    private Integer timeOnTaskMinutes;
    /** Placeholder until rubric analytics are wired. */
    private String rubricBreakdownSummary;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LastActivityDTO {
        private Long assignmentId;
        private String assignmentName;
        private LocalDateTime submittedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPointDTO {
        private Long assignmentId;
        private String assignmentName;
        private Double score;
        private Double maxScore;
        private LocalDateTime gradedAt;
    }
}

