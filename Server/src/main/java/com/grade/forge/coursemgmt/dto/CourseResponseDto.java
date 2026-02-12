package com.grade.forge.coursemgmt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponseDto {

    private Long id;
    private String name;
    private String courseCode;
    private String section;
    private String description;
    private String imageUrl;
    private String canvasCourseId;
    private Boolean active;
    private Boolean isPublished;
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
