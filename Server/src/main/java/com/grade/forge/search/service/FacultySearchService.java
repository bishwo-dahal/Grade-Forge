package com.grade.forge.search.service;

import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacultySearchService {

    private final FacultyRepository facultyRepository;

    public List<FacultyResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return facultyRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(keyword, keyword, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FacultyResponse mapToResponse(Faculty faculty) {
        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(faculty.getId());
        response.setName(faculty.getName());
        response.setDepartment(faculty.getDepartment());
        response.setQualifications(faculty.getQualifications());
        response.setPhoneNumber(faculty.getPhoneNumber());
        response.setOfficeLocation(faculty.getOfficeLocation());
        response.setActive(faculty.getActive());

        if (faculty.getUser() != null) {
            response.setUserId(faculty.getUser().getId());
            response.setEmail(faculty.getUser().getEmail());
            response.setRole(faculty.getUser().getRole() != null ? faculty.getUser().getRole().toString() : null);
        } else {
            response.setEmail(faculty.getEmail());
        }
        return response;
    }
}

