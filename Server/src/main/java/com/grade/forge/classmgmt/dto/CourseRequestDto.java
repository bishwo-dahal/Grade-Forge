package com.grade.forge.classmgmt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRequestDto {

    private String name;
    private String section;
    private String semester;
    private Boolean active;
    private Long facultyId;
}

