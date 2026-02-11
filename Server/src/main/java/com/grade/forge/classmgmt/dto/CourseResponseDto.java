package com.grade.forge.classmgmt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponseDto {

    private Long id;
    private String name;
    private String section;
    private Boolean active;
    private SemesterBasicDto semester;
    private FacultyBasicDto faculty;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SemesterBasicDto {
        private Long id;
        private String name;
        private String startDate;
        private String endDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FacultyBasicDto {
        private Long id;
        private String name;
        private String email;
        private String department;
        private String qualifications;
    }
}
