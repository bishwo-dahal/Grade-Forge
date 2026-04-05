package com.grade.forge.submission.dto;

import com.grade.forge.submission.enums.AuthorshipTriageLabel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorshipTriageExportItem {
    private Long submissionId;
    private Long studentId;
    private AuthorshipTriageLabel label;
    private Instant labeledAt;
    private String notes;
}
