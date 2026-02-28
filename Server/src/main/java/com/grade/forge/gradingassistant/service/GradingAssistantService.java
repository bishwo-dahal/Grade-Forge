package com.grade.forge.gradingassistant.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
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
    private final PasswordEncoder passwordEncoder;

    public GradingAssistantResponse createGradingAssistant(GradingAssistantRequest request) {
        validateCreateRequest(request);
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            throw new IllegalArgumentException("User with email already exists: " + request.getEmail());
        });

        Users user = new Users();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.GRADING_ASSISTANT);
        Users savedUser = userRepository.save(user);

        GradingAssistant gradingAssistant = new GradingAssistant();
        gradingAssistant.setUser(savedUser);
        gradingAssistant.setOfficeHours(request.getOfficeHours().trim());
        gradingAssistant.setDepartment(request.getDepartment().trim());

        GradingAssistant saved = gradingAssistantRepository.save(gradingAssistant);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public GradingAssistantResponse getGradingAssistant(Long id) {
        GradingAssistant gradingAssistant = findById(id);
        return mapToResponse(gradingAssistant);
    }

    @Transactional(readOnly = true)
    public List<GradingAssistantResponse> getAllGradingAssistants() {
        return gradingAssistantRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GradingAssistantResponse updateGradingAssistant(Long id, GradingAssistantRequest request) {
        GradingAssistant gradingAssistant = findById(id);
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

    public void deleteGradingAssistant(Long id) {
        GradingAssistant gradingAssistant = findById(id);
        Users user = gradingAssistant.getUser();
        gradingAssistantRepository.delete(gradingAssistant);
        if (user != null) {
            userRepository.deleteById(user.getId());
        }
    }

    private GradingAssistant findById(Long id) {
        return gradingAssistantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found with id: " + id));
    }

    private GradingAssistantResponse mapToResponse(GradingAssistant gradingAssistant) {
        Users user = gradingAssistant.getUser();
        return GradingAssistantResponse.builder()
                .id(gradingAssistant.getId())
                .userId(user != null ? user.getId() : null)
                .name(user != null ? user.getName() : null)
                .email(user != null ? user.getEmail() : null)
                .role(user != null && user.getRole() != null ? user.getRole().toString() : null)
                .officeHours(gradingAssistant.getOfficeHours())
                .department(gradingAssistant.getDepartment())
                .build();
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

