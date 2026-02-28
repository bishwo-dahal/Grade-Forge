package com.grade.forge.faculty.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacultyUpdateRequest {
    private String name;
    private String email;
    private String department;
    private String qualifications;
    private String phoneNumber;
    private String officeLocation;
}

