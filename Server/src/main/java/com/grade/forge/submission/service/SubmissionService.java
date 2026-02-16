package com.grade.forge.submission.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.submission.dto.SubmissionFileResponse;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.dto.SubmissionGradeRequest;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionFile;
import com.grade.forge.submission.repository.SubmissionRepository;
import com.grade.forge.submission.repository.SubmissionFileRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileStorageService fileStorageService;
    private final SubmissionFileRepository submissionFileRepository;
    private final FacultyRepository facultyRepository;

    public SubmissionResponse submitAssignment(String userEmail, Long assignmentId, List<MultipartFile> files) {
        validateRequest(assignmentId, files);

        Users user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + userEmail));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmittedAt(LocalDateTime.now());

        List<SubmissionFile> submissionFiles = fileStorageService.uploadSubmissionFiles(
                submission,
                student.getId(),
                assignment.getCourse().getId(),
                assignment.getId(),
                files);
        submission.setFiles(submissionFiles);

        Submission saved = submissionRepository.save(submission);
        submissionFiles.forEach(file -> file.setSubmission(saved));
        submissionFileRepository.saveAll(submissionFiles);
        saved.setFiles(submissionFiles);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionForCurrentStudent(String userEmail, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getStudent().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not allowed to access this submission");
        }

        return mapToResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsForCurrentStudentByAssignment(String userEmail, Long assignmentId) {
        Users user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + userEmail));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        List<Submission> submissions = submissionRepository.findByAssignment_IdAndStudent_Id(assignment.getId(), student.getId());
        return submissions.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsForFacultyByAssignment(String facultyEmail, Long assignmentId) {
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (!assignment.getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to view submissions for this assignment");
        }

        List<Submission> submissions = submissionRepository.findByAssignment_Id(assignmentId);
        return submissions.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public SubmissionResponse updateGradeForSubmission(String facultyEmail, Long submissionId, SubmissionGradeRequest request) {
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getAssignment().getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to grade this submission");
        }

        if (request.getMarks() != null) {
            submission.setMarks(request.getMarks());
        }
        if (request.getFeedback() != null) {
            submission.setFeedback(request.getFeedback());
        }

        Submission saved = submissionRepository.save(submission);
        return mapToResponse(saved);
    }

    private void validateRequest(Long assignmentId, List<MultipartFile> files) {
        if (assignmentId == null) {
            throw new IllegalArgumentException("assignmentId is required");
        }
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one file is required");
        }
        files.forEach(file -> {
            if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
                throw new IllegalArgumentException("fileName is required for all files");
            }
            if (file.getContentType() == null || file.getContentType().isBlank()) {
                throw new IllegalArgumentException("fileType is required for all files");
            }
        });
    }

    private SubmissionResponse mapToResponse(Submission submission) {
        return SubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .assignmentName(submission.getAssignment().getName())
                .courseId(submission.getAssignment().getCourse().getId())
                .courseName(submission.getAssignment().getCourse().getName())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getUser().getName())
                .studentEmail(submission.getStudent().getUser().getEmail())
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
                .downloadUrl(fileStorageService.buildFileUrl(file.getFileKey()))
                .build();
    }
}
