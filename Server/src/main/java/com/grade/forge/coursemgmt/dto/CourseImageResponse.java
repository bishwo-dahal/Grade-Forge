package com.grade.forge.coursemgmt.dto;

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
public class CourseImageResponse {
    private Long id;
    private String fileName;
    private String fileKey;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;
}
