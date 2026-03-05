package com.grade.forge.programminglanguage.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.programminglanguage.dto.ProgrammingLanguageRequest;
import com.grade.forge.programminglanguage.dto.ProgrammingLanguageResponse;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.programminglanguage.repository.ProgrammingLanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProgrammingLanguageService {

    private final ProgrammingLanguageRepository programmingLanguageRepository;

    public ProgrammingLanguageResponse createProgrammingLanguage(ProgrammingLanguageRequest request) {
        validateCreateRequest(request);
        ProgrammingLanguage language = mapToEntity(request, new ProgrammingLanguage());
        if (language.getIsActive() == null) {
            language.setIsActive(true);
        }
        ProgrammingLanguage saved = programmingLanguageRepository.save(language);
        return mapToResponse(saved);
    }

    public ProgrammingLanguageResponse updateProgrammingLanguage(Long id, ProgrammingLanguageRequest request) {
        ProgrammingLanguage language = programmingLanguageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equalsIgnoreCase(language.getName())) {
                Optional<ProgrammingLanguage> existing = programmingLanguageRepository.findByNameIgnoreCase(request.getName());
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    throw new IllegalArgumentException("Programming language with name " + request.getName() + " already exists");
                }
                language.setName(request.getName());
            }
        }
        if (request.getDockerImage() != null) {
            if (request.getDockerImage().isBlank()) {
                throw new IllegalArgumentException("Docker image cannot be blank");
            }
            language.setDockerImage(request.getDockerImage());
        }
        if (request.getCompileCommand() != null) {
            language.setCompileCommand(request.getCompileCommand());
        }
        if (request.getExecutionCode() != null) {
            language.setExecutionCode(request.getExecutionCode());
        }
        if (request.getIsActive() != null) {
            language.setIsActive(request.getIsActive());
        }

        ProgrammingLanguage saved = programmingLanguageRepository.save(language);
        return mapToResponse(saved);
    }

    public ProgrammingLanguageResponse getProgrammingLanguage(Long id) {
        ProgrammingLanguage language = programmingLanguageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + id));
        return mapToResponse(language);
    }

    public List<ProgrammingLanguageResponse> getAllProgrammingLanguages() {
        return programmingLanguageRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProgrammingLanguageResponse> getActiveProgrammingLanguages() {
        return programmingLanguageRepository.findAll().stream()
                .filter(lang -> Boolean.TRUE.equals(lang.getIsActive()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProgrammingLanguageResponse disableProgrammingLanguage(Long id) {
        ProgrammingLanguage language = programmingLanguageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + id));
        language.setIsActive(false);
        ProgrammingLanguage saved = programmingLanguageRepository.save(language);
        return mapToResponse(saved);
    }

    public void deleteProgrammingLanguage(Long id) {
        ProgrammingLanguage language = programmingLanguageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + id));
        programmingLanguageRepository.delete(language);
    }

    private void validateCreateRequest(ProgrammingLanguageRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Programming language name is required");
        }
        if (programmingLanguageRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("Programming language with name " + request.getName() + " already exists");
        }
        if (request.getDockerImage() == null || request.getDockerImage().isBlank()) {
            throw new IllegalArgumentException("Docker image is required");
        }
    }

    private ProgrammingLanguage mapToEntity(ProgrammingLanguageRequest request, ProgrammingLanguage target) {
        target.setName(request.getName());
        target.setDockerImage(request.getDockerImage());
        target.setCompileCommand(request.getCompileCommand());
        target.setExecutionCode(request.getExecutionCode());
        target.setIsActive(request.getIsActive());
        return target;
    }

    private ProgrammingLanguageResponse mapToResponse(ProgrammingLanguage language) {
        return ProgrammingLanguageResponse.builder()
                .id(language.getId())
                .name(language.getName())
                .dockerImage(language.getDockerImage())
                .compileCommand(language.getCompileCommand())
                .executionCode(language.getExecutionCode())
                .isActive(language.getIsActive())
                .build();
    }
}

