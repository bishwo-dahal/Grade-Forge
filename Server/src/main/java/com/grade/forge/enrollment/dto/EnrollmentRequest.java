package com.grade.forge.enrollment.dto;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Setter
public class EnrollmentRequest {
    private Long studentId;
    private Long courseId;
    private Long canvasId;
}

