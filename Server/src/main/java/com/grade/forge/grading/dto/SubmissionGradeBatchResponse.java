package com.grade.forge.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionGradeBatchResponse {
    private Long submissionId;
    private List<SubmissionGradeItemResponse> grades;
}


