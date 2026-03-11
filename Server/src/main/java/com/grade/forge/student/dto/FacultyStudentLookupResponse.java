package com.grade.forge.student.dto;

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
public class FacultyStudentLookupResponse {
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Boolean alreadyInCourse;
    private String currentStatus;
    private Boolean canEnroll;
    private String reason;
}
