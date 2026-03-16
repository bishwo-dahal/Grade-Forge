package com.grade.forge.submission.dto;

import com.grade.forge.submission.enums.SubmissionStatus;
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
public class SubmissionSummaryResponse {
    private Long submissionId;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Double grade;
    private String feedback;
    private SubmissionStatus status;
    private LocalDateTime submittedAt;
}



