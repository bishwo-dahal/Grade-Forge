package com.grade.forge.graderreport.entity;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.enums.GraderReportTriggerType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One run of the grader pipeline for an assignment.
 * Holds the full pipeline output (similarity, ai_features, comparisons, etc.) in resultJson.
 */
@Entity
@Table(
    name = "grader_reports",
    indexes = {
        @Index(name = "idx_grader_reports_assignment_generated", columnList = "assignment_id, generated_at DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GraderReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private GraderReportTriggerType triggerType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GraderReportStatus status = GraderReportStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Full pipeline output JSON (similarity, ai_features, results per student, comparisons, highlight_markers).
     * Stored as TEXT; set when status becomes COMPLETED.
     */
    @Column(name = "result_json", columnDefinition = "TEXT")
    private String resultJson;
}
