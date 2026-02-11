package com.grade.forge.semester.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterResponseDto {
    private Long id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
}
