package com.grade.forge.graderreport.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent to the grader-report-jobs queue.
 * Consumer deserializes this and runs the grader pipeline for the given report.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GraderReportMessage {
    private Long graderReportId;
}
