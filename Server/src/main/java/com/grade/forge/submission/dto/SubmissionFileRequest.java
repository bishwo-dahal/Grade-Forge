package com.grade.forge.submission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SubmissionFileRequest {
    private String fileName;
    private String fileKey;
    private String fileType;
    private Long fileSize;
}

