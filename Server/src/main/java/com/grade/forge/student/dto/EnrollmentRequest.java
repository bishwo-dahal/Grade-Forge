package com.grade.forge.student.dto;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Setter
public class EnrollmentRequest {
    private Long studentId;
    private Long courseId;
}

