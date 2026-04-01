package com.grade.forge.search.service;

import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.gradingassistant.dto.GradingAssistantResponse;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import com.grade.forge.gradingassistant.repository.GradingAssistantRepository;
import com.grade.forge.user.entity.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GASearchService {

    private final GradingAssistantRepository gradingAssistantRepository;

    public List<GradingAssistantResponse> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return gradingAssistantRepository
                .findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(keyword, keyword, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private GradingAssistantResponse mapToResponse(GradingAssistant gradingAssistant) {
        Users user = gradingAssistant.getUser();
        return GradingAssistantResponse.builder()
                .id(gradingAssistant.getId())
                .userId(user != null ? user.getId() : null)
                .facultyId(gradingAssistant.getFaculty() != null ? gradingAssistant.getFaculty().getId() : null)
                .name(user != null ? user.getName() : null)
                .email(user != null ? user.getEmail() : null)
                .role(user != null && user.getRole() != null ? user.getRole().toString() : null)
                .officeHours(gradingAssistant.getOfficeHours())
                .department(gradingAssistant.getDepartment())
                .faculty(mapFacultyResponse(gradingAssistant))
                .build();
    }

    private FacultyResponse mapFacultyResponse(GradingAssistant gradingAssistant) {
        if (gradingAssistant.getFaculty() == null) {
            return null;
        }

        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(gradingAssistant.getFaculty().getId());
        response.setName(gradingAssistant.getFaculty().getName());
        response.setDepartment(gradingAssistant.getFaculty().getDepartment());
        response.setQualifications(gradingAssistant.getFaculty().getQualifications());
        response.setPhoneNumber(gradingAssistant.getFaculty().getPhoneNumber());
        response.setOfficeLocation(gradingAssistant.getFaculty().getOfficeLocation());
        response.setActive(gradingAssistant.getFaculty().getActive());
        response.setOfficeHours(gradingAssistant.getFaculty().getOfficeHours());

        if (gradingAssistant.getFaculty().getUser() != null) {
            response.setUserId(gradingAssistant.getFaculty().getUser().getId());
            response.setEmail(gradingAssistant.getFaculty().getUser().getEmail());
            response.setRole(gradingAssistant.getFaculty().getUser().getRole() != null ? gradingAssistant.getFaculty().getUser().getRole().toString() : null);
        } else {
            response.setEmail(gradingAssistant.getFaculty().getEmail());
        }
        return response;
    }
}

