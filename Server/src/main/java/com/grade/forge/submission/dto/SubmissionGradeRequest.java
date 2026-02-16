package com.grade.forge.submission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SubmissionGradeRequest {
    private Double marks;
    private String feedback;
}

