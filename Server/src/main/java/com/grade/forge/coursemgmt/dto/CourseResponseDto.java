package com.grade.forge.coursemgmt.dto;

import lombok.*;

import java.util.List;

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
    private CourseImageResponse courseImage;
    private String canvasCourseId;
    private Boolean active;
    private Boolean isPublished;
    private SemesterBasicDto semester;
    private FacultyBasicDto faculty;

    /** Set when this course is a section linked to a main course; same as {@code parentCourse.id} when present. */
    private Long parentCourseId;

    /** Minimal main-course info for section banners and navigation; null when {@code parentCourseId} is null. */
    private ParentCourseSummaryDto parentCourse;

    /** Linked section courses when this row is a main (parent) course; empty when none. */
    private List<SectionCourseSummaryDto> sectionCourses;

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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParentCourseSummaryDto {
        private Long id;
        private String name;
        private String courseCode;
        private String section;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SectionCourseSummaryDto {
        private Long id;
        private String name;
        private String courseCode;
        private String section;
    }
}
