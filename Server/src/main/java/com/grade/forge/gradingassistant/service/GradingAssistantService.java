package com.grade.forge.gradingassistant.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.dto.FacultyResponse;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.gradingassistant.dto.GradingAssistantRequest;
import com.grade.forge.gradingassistant.dto.GradingAssistantResponse;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import com.grade.forge.gradingassistant.repository.GradingAssistantRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GradingAssistantService {

    private final GradingAssistantRepository gradingAssistantRepository;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final PasswordEncoder passwordEncoder;

    public GradingAssistantResponse createGradingAssistant(GradingAssistantRequest request, Long facultyUserId) {
        validateCreateRequest(request);
        Faculty faculty = resolveFaculty(facultyUserId);
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            throw new IllegalArgumentException("User with email already exists: " + request.getEmail());
        });

        Users user = new Users();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.GRADING_ASSISTANT);
        if (user.getPreferences() == null) {
            user.setPreferences(new java.util.HashMap<>());
        }
        Users savedUser = userRepository.save(user);

        GradingAssistant gradingAssistant = new GradingAssistant();
        gradingAssistant.setUser(savedUser);
        gradingAssistant.setFaculty(faculty);
        gradingAssistant.setOfficeHours(request.getOfficeHours().trim());
        gradingAssistant.setDepartment(request.getDepartment().trim());

        GradingAssistant saved = gradingAssistantRepository.save(gradingAssistant);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public GradingAssistantResponse getGradingAssistant(Long id, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        GradingAssistant gradingAssistant = findByIdAndFaculty(id, faculty.getId());
        return mapToResponse(gradingAssistant);
    }

    @Transactional(readOnly = true)
    public GradingAssistantResponse getCurrentGradingAssistant(Long userId) {
        GradingAssistant gradingAssistant = gradingAssistantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found for user id: " + userId));
        return mapToResponse(gradingAssistant);
    }

    @Transactional(readOnly = true)
    public List<GradingAssistantResponse> getAllGradingAssistants(Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        return gradingAssistantRepository.findAllByFacultyId(faculty.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GradingAssistantResponse updateGradingAssistant(Long id, GradingAssistantRequest request, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        GradingAssistant gradingAssistant = findByIdAndFaculty(id, faculty.getId());
        Users user = gradingAssistant.getUser();

        if (hasText(request.getName())) {
            user.setName(request.getName().trim());
        }

        if (hasText(request.getEmail()) && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            Optional<Users> existingByEmail = userRepository.findByEmailIgnoreCase(request.getEmail());
            if (existingByEmail.isPresent() && !existingByEmail.get().getId().equals(user.getId())) {
                throw new IllegalArgumentException("User with email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail().trim());
        }

        if (hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (hasText(request.getOfficeHours())) {
            gradingAssistant.setOfficeHours(request.getOfficeHours().trim());
        }

        if (hasText(request.getDepartment())) {
            gradingAssistant.setDepartment(request.getDepartment().trim());
        }

        userRepository.save(user);
        GradingAssistant saved = gradingAssistantRepository.save(gradingAssistant);
        return mapToResponse(saved);
    }

    public void deleteGradingAssistant(Long id, Long facultyUserId) {
        Faculty faculty = resolveFaculty(facultyUserId);
        GradingAssistant gradingAssistant = findByIdAndFaculty(id, faculty.getId());
        Users user = gradingAssistant.getUser();
        gradingAssistantRepository.delete(gradingAssistant);
        if (user != null) {
            userRepository.deleteById(user.getId());
        }
    }

    private Faculty resolveFaculty(Long facultyUserId) {
        return facultyRepository.findByUser_Id(facultyUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found for user id: " + facultyUserId));
    }

    private GradingAssistant findByIdAndFaculty(Long id, Long facultyId) {
        return gradingAssistantRepository.findByIdAndFacultyId(id, facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found with id: " + id));
    }

    private GradingAssistantResponse mapToResponse(GradingAssistant gradingAssistant) {
        Users user = gradingAssistant.getUser();
        Faculty faculty = gradingAssistant.getFaculty();

        return GradingAssistantResponse.builder()
                .id(gradingAssistant.getId())
                .userId(user != null ? user.getId() : null)
                .facultyId(faculty != null ? faculty.getId() : null)
                .name(user != null ? user.getName() : null)
                .email(user != null ? user.getEmail() : null)
                .role(user != null && user.getRole() != null ? user.getRole().toString() : null)
                .officeHours(gradingAssistant.getOfficeHours())
                .department(gradingAssistant.getDepartment())
                .faculty(mapFacultyResponse(faculty))
                .build();
    }

    private FacultyResponse mapFacultyResponse(Faculty faculty) {
        if (faculty == null) {
            return null;
        }
        FacultyResponse response = new FacultyResponse();
        response.setFacultyId(faculty.getId());
        response.setName(faculty.getName());
        response.setDepartment(faculty.getDepartment());
        response.setQualifications(faculty.getQualifications());
        response.setPhoneNumber(faculty.getPhoneNumber());
        response.setOfficeLocation(faculty.getOfficeLocation());
        response.setActive(faculty.getActive());
        response.setOfficeHours(faculty.getOfficeHours());
        if (faculty.getUser() != null) {
            response.setUserId(faculty.getUser().getId());
            response.setEmail(faculty.getUser().getEmail());
            response.setRole(faculty.getUser().getRole() != null ? faculty.getUser().getRole().toString() : null);
        } else {
            response.setEmail(faculty.getEmail());
        }
        return response;
    }

    private void validateCreateRequest(GradingAssistantRequest request) {
        if (!hasText(request.getName())) {
            throw new IllegalArgumentException("Name is required");
        }
        if (!hasText(request.getEmail())) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!hasText(request.getPassword())) {
            throw new IllegalArgumentException("Password is required");
        }
        if (!hasText(request.getOfficeHours())) {
            throw new IllegalArgumentException("Office hours are required");
        }
        if (!hasText(request.getDepartment())) {
            throw new IllegalArgumentException("Department is required");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
