package com.grade.forge.faculty.service;

import com.grade.forge.configuration.security.CustomUserDetails;
import com.grade.forge.faculty.entity.Faculty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Optional;

public interface FacultyServiceInterface {
    Faculty createFaculty(Faculty faculty);
    Optional<Faculty> getFacultyById(Long id);
    Faculty updateFaculty(Long id, Faculty faculty);
    Faculty disableFaculty(Long id);
    List<Faculty> getAllFacultyByDepartment(String department);
    List<Faculty> getAllActiveFaculty();
    void deleteFaculty(Long id);
}

