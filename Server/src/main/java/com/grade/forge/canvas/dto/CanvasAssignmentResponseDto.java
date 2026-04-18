package com.grade.forge.canvas.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CanvasAssignmentResponseDto {
    private Long id;                // ⭐ Canvas assignment ID
    private Long course_id;

    private String name;
    private String description;

    private Double points_possible;

    private String due_at;
    private String lock_at;
    private String unlock_at;

    private Boolean published;

    private String html_url;

    private String workflow_state;
}
