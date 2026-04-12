package com.grade.forge.faculty.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FacultyResponse {
    private Long facultyId;
    private String name;
    private String department;
    private String qualifications;
    private String phoneNumber;
    private String officeLocation;
    private Boolean active;
    private String officeHours;

    // login info (safe only)
    private Long userId;
    private String email;
    private String role;
}
