package com.grade.forge.canvas.dto;

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
public class CanvasStudentDto {

    private String name;
    private String loginId;
    private String state;
    private String createdAt;
}

