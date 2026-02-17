package com.grade.forge.student.dto;

import com.grade.forge.student.enums.EnrolledStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long courseId;
    private LocalDateTime enrolledAt;
    private EnrolledStatus enrolledStatus;
    private String grade;
}
