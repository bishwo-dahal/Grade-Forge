package com.grade.forge.submission.dto;

import com.grade.forge.submission.enums.AuthorshipTriageLabel;
import lombok.Getter;
import lombok.Setter;

/**
 * PATCH body: set label to null to remove triage for this submission.
 */
@Getter
@Setter
public class AuthorshipTriageRequest {

    private AuthorshipTriageLabel label;
    private String notes;
}
