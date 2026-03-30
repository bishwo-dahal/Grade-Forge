package com.grade.forge.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentStarterFileResponse {
    private Long id;
    private String fileName;
    private String fileKey;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;
}

