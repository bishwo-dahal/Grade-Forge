package com.grade.forge.semester.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.semester.dto.SemesterRequestDto;
import com.grade.forge.semester.dto.SemesterResponseDto;
import com.grade.forge.semester.entity.Semester;
import com.grade.forge.semester.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SemesterService {

    private final SemesterRepository semesterRepository;
    private final ModelMapper modelMapper;

    public SemesterResponseDto createSemester(SemesterRequestDto requestDto) {
        validate(requestDto);
        Semester semester = modelMapper.map(requestDto, Semester.class);
        Semester saved = semesterRepository.save(semester);
        return mapToResponse(saved);
    }

    public SemesterResponseDto updateSemester(Long id, SemesterRequestDto requestDto) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + id));

        if (requestDto.getName() != null) {
            semester.setName(requestDto.getName());
        }
        if (requestDto.getStartDate() != null) {
            semester.setStartDate(requestDto.getStartDate());
        }
        if (requestDto.getEndDate() != null) {
            semester.setEndDate(requestDto.getEndDate());
        }
        validateDates(semester.getStartDate(), semester.getEndDate());
        Semester saved = semesterRepository.save(semester);
        return mapToResponse(saved);
    }

    public SemesterResponseDto getSemester(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + id));
        return mapToResponse(semester);
    }

    public List<SemesterResponseDto> getAllSemesters() {
        return semesterRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteSemester(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + id));
        semesterRepository.delete(semester);
    }

    private void validate(SemesterRequestDto dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Semester name is required");
        }
        validateDates(dto.getStartDate(), dto.getEndDate());
    }

    private void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Semester start date and end date are required");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("Semester end date cannot be before start date");
        }
    }

    private SemesterResponseDto mapToResponse(Semester semester) {
        return SemesterResponseDto.builder()
                .id(semester.getId())
                .name(semester.getName())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .build();
    }
}
