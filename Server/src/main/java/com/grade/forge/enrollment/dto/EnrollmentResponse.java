package com.grade.forge.enrollment.dto;

import com.grade.forge.enrollment.enums.EnrolledStatus;
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
    // NOTE: Faculty class-management student table renders email directly from enrollment payload.
    private String studentEmail;
    private Long courseId;
    private LocalDateTime enrolledAt;
    private EnrolledStatus enrolledStatus;
    private String grade;
}
