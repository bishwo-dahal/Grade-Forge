package com.grade.forge.student.service;

import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.student.dto.StudentRequest;
import com.grade.forge.student.dto.StudentResponse;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public StudentResponse createStudent(StudentRequest request) {
        validateCreateRequest(request);
        Users user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        studentRepository.findByUserId(user.getId()).ifPresent(existing -> {
            throw new IllegalArgumentException("Student already exists for user id: " + user.getId());
        });
        if (studentRepository.existsByCwid(request.getCwid())) {
            throw new IllegalArgumentException("Student already exists with CWID: " + request.getCwid());
        }

        Student student = new Student();
        student.setUser(user);
        mapToEntity(request, student);

        Student saved = studentRepository.save(student);
        return mapToResponse(saved);
    }


    public StudentResponse updateCurrentStudent(String email, StudentRequest request) {
        Student student = resolveStudentByUserEmail(email);
        applyUpdates(student, request);
        Student saved = studentRepository.save(student);
        return mapToResponse(saved);
    }

    public StudentResponse completeCurrentStudentRegistration(String email, StudentRequest request) {
        validateCompletionRequest(request);
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // NOTE: Registration completion must work for both first-time student profile creation and subsequent edits.
        Student student = studentRepository.findByUserId(user.getId()).orElseGet(() -> {
            Student created = new Student();
            created.setUser(user);
            created.setPreferences(new HashMap<>());
            return created;
        });

        String normalizedCwid = request.getCwid().trim();
        Optional<Student> existingByCwid = studentRepository.findByCwid(normalizedCwid);
        if (existingByCwid.isPresent() && !existingByCwid.get().getId().equals(student.getId())) {
            throw new IllegalArgumentException("Student already exists with CWID: " + normalizedCwid);
        }

        student.setCwid(normalizedCwid);
        student.setMajor(request.getMajor().trim());
        student.setCanvasUserId(request.getCanvasUserId().trim());
        if (request.getPreferences() != null) {
            student.setPreferences(request.getPreferences());
        } else if (student.getPreferences() == null) {
            student.setPreferences(new HashMap<>());
        }

        Student saved = studentRepository.save(student);
        return mapToResponse(saved);
    }


    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentByUserEmail(String email) {
        Student student = resolveStudentByUserEmail(email);
        return mapToResponse(student);
    }

    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        studentRepository.delete(student);
    }

    private void validateCreateRequest(StudentRequest request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("User id is required to create a student");
        }
        if (request.getCwid() == null || request.getCwid().isBlank()) {
            throw new IllegalArgumentException("CWID is required");
        }
        if (request.getMajor() == null || request.getMajor().isBlank()) {
            throw new IllegalArgumentException("Major is required");
        }
    }

    private void validateCompletionRequest(StudentRequest request) {
        // IMPORTANT: Completion endpoint intentionally requires all fields so dashboard access is gated on a complete profile.
        if (request.getCwid() == null || request.getCwid().isBlank()) {
            throw new IllegalArgumentException("CWID is required");
        }
        if (request.getMajor() == null || request.getMajor().isBlank()) {
            throw new IllegalArgumentException("Major is required");
        }
        if (request.getCanvasUserId() == null || request.getCanvasUserId().isBlank()) {
            throw new IllegalArgumentException("Canvas ID is required");
        }
    }

    private void mapToEntity(StudentRequest request, Student student) {
        student.setCwid(request.getCwid());
        student.setMajor(request.getMajor());
        student.setCanvasUserId(request.getCanvasUserId());
        if (request.getPreferences() != null) {
            student.setPreferences(request.getPreferences());
        } else if (student.getPreferences() == null) {
            student.setPreferences(new HashMap<>());
        }
    }

    private void applyUpdates(Student student, StudentRequest request) {
        if (request.getCwid() != null && !request.getCwid().isBlank()) {
            if (!request.getCwid().equalsIgnoreCase(student.getCwid())) {
                Optional<Student> existingByCwid = studentRepository.findByCwid(request.getCwid());
                if (existingByCwid.isPresent() && !existingByCwid.get().getId().equals(student.getId())) {
                    throw new IllegalArgumentException("Student already exists with CWID: " + request.getCwid());
                }
                student.setCwid(request.getCwid());
            }
        }
        if (request.getMajor() != null && !request.getMajor().isBlank()) {
            student.setMajor(request.getMajor());
        }
        if (request.getCanvasUserId() != null) {
            student.setCanvasUserId(request.getCanvasUserId());
        }
        if (request.getPreferences() != null) {
            student.setPreferences(request.getPreferences());
        } else if (student.getPreferences() == null) {
            student.setPreferences(new HashMap<>());
        }
    }

    private Student resolveStudentByUserEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + email));
    }

    private StudentResponse mapToResponse(Student student) {
        return StudentResponse.builder()
                .id(student.getId())
                .userId(student.getUser() != null ? student.getUser().getId() : null)
                .cwid(student.getCwid())
                .major(student.getMajor())
                .canvasUserId(student.getCanvasUserId())
                .preferences(student.getPreferences())
                .build();
    }
}

