package com.grade.forge.submission.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.submission.dto.SubmissionFileRequest;
import com.grade.forge.submission.dto.SubmissionFileResponse;
import com.grade.forge.submission.dto.SubmissionRequest;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionFile;
import com.grade.forge.submission.repository.SubmissionRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public SubmissionResponse submitAssignment(String userEmail, SubmissionRequest request) {
        validateRequest(request);

        Users user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + userEmail));

        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + request.getAssignmentId()));

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmittedAt(LocalDateTime.now());

        List<SubmissionFile> files = request.getFiles().stream()
                .map(fileRequest -> mapToSubmissionFile(fileRequest, submission))
                .collect(Collectors.toList());
        submission.setFiles(files);

        Submission saved = submissionRepository.save(submission);
        return mapToResponse(saved);
    }

    private void validateRequest(SubmissionRequest request) {
        if (request.getAssignmentId() == null) {
            throw new IllegalArgumentException("assignmentId is required");
        }
        if (request.getFiles() == null || request.getFiles().isEmpty()) {
            throw new IllegalArgumentException("At least one file is required");
        }
        request.getFiles().forEach(file -> {
            if (file.getFileName() == null || file.getFileName().isBlank()) {
                throw new IllegalArgumentException("fileName is required for all files");
            }
            if (file.getFileKey() == null || file.getFileKey().isBlank()) {
                throw new IllegalArgumentException("fileKey is required for all files");
            }
            if (file.getFileType() == null || file.getFileType().isBlank()) {
                throw new IllegalArgumentException("fileType is required for all files");
            }
        });
    }

    private SubmissionFile mapToSubmissionFile(SubmissionFileRequest request, Submission submission) {
        SubmissionFile file = new SubmissionFile();
        file.setSubmission(submission);
        file.setFileName(request.getFileName());
        file.setFileKey(request.getFileKey());
        file.setFileType(request.getFileType());
        file.setFileSize(request.getFileSize());
        return file;
    }

    private SubmissionResponse mapToResponse(Submission submission) {
        return SubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .studentId(submission.getStudent().getId())
                .files(submission.getFiles() == null ? List.of() : submission.getFiles().stream()
                        .map(this::mapToFileResponse)
                        .collect(Collectors.toList()))
                .marks(submission.getMarks())
                .feedback(submission.getFeedback())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    private SubmissionFileResponse mapToFileResponse(SubmissionFile file) {
        return SubmissionFileResponse.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileKey(file.getFileKey())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .build();
    }
}
