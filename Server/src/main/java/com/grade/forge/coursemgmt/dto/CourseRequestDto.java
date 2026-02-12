package com.grade.forge.coursemgmt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRequestDto {

    private String name;
    private String courseCode;
    private String section;
    private String description;
    private String imageUrl;
    private String canvasCourseId;
    private Boolean isPublished;
    private Long semesterId;
    private Boolean active;
    private Long facultyId;
}
