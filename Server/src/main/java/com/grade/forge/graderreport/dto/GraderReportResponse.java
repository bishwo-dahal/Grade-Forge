package com.grade.forge.graderreport.dto;

import com.grade.forge.graderreport.enums.GraderReportStatus;
import com.grade.forge.graderreport.enums.GraderReportTriggerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraderReportResponse {

    private Long id;
    private Long assignmentId;
    private Instant generatedAt;
    private GraderReportTriggerType triggerType;
    private GraderReportStatus status;
    private String errorMessage;
    /** Full pipeline JSON when status is COMPLETED; null otherwise. */
    private String result;
}
