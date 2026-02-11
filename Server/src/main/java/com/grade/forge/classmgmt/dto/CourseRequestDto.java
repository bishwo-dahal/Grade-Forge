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
    private Long semesterId;
    private Boolean active;
    private Long facultyId;
}
