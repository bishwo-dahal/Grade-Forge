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
public class FacultyStudentEmailSuggestionResponse {
    private String email;
    private Boolean alreadyInCourse;
}
