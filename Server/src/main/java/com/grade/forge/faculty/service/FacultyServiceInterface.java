package com.grade.forge.faculty.service;

import com.grade.forge.faculty.dto.FacultyCreateRequest;
import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.dto.FacultyUpdateRequest;
import com.grade.forge.faculty.entity.Faculty;

import java.util.List;

public interface FacultyServiceInterface {
    FacultyResponse createFaculty(FacultyCreateRequest facultyCreateRequest);
    FacultyResponse getFacultyById(Long id);
    FacultyResponse updateFaculty(Long id, Faculty faculty);
    FacultyResponse disableFaculty(Long id);
    List<FacultyResponse> getAllFaculty();
    List<FacultyResponse> getAllFacultyByDepartment(String department);
    List<FacultyResponse> getAllActiveFaculty();
    void deleteFaculty(Long id);
    FacultyResponse getFacultyByUserEmail(String email);
    FacultyResponse updateCurrentFaculty(String email, FacultyUpdateRequest request);
}
