package com.grade.forge.search.dto;

import com.grade.forge.enrollment.enums.EnrolledStatus;
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
public class StudentSearchResponseDto {
    private Long id;
    private Long userId;
    private String cwid;
    private String major;
    private String canvasUserId;
    private String name;
    private String email;
    private EnrolledStatus enrolledStatus;

}
