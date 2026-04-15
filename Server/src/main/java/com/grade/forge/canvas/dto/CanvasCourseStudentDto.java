package com.grade.forge.canvas.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CanvasCourseStudentDto {

    private Long id;
    private String name;

    @JsonProperty("sortable_name")
    private String sortableName;

    @JsonProperty("login_id")
    private String loginId;
}
