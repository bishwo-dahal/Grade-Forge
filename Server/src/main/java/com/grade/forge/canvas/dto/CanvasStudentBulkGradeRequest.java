package com.grade.forge.canvas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanvasStudentBulkGradeRequest {
    private Long studentId;
    private Double points;
    private String feedback;
}

