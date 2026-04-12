package com.grade.forge.submission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class SubmissionRequest {
    private Long assignmentId;
    private List<SubmissionFileRequest> files;
}
