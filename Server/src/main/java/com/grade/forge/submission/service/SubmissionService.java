package com.grade.forge.submission.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.email.service.EmailService;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.group.dto.GroupStudentResponse;
import com.grade.forge.group.entity.MainGroup;
import com.grade.forge.group.entity.SubGroup;
import com.grade.forge.group.repository.SubGroupRepository;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.submission.dto.SubmissionFileResponse;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.dto.SubmissionGradeRequest;
import com.grade.forge.submission.dto.SubmissionSummaryResponse;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionFile;
import com.grade.forge.submission.enums.SubmissionStatus;
import com.grade.forge.submission.repository.SubmissionRepository;
import com.grade.forge.submission.repository.SubmissionFileRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.execution.service.TestRunJobService;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.courseassistant.repository.CourseAssistantRepository;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import com.grade.forge.gradingassistant.repository.GradingAssistantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final SubmissionFileRepository submissionFileRepository;
    private final TestRunJobService testRunJobService;
    private final FacultyRepository facultyRepository;
    private final GradingAssistantRepository gradingAssistantRepository;
    private final CourseAssistantRepository courseAssistantRepository;
    private final SubGroupRepository subGroupRepository;
    private final EmailService emailService;

    public SubmissionResponse submitAssignment(String userEmail, Long assignmentId, List<MultipartFile> files) {
        validateRequest(assignmentId, files);

        Users user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + userEmail));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        boolean assignmentHasTests = assignment.getTestSuite() != null
                && assignment.getTestSuite().getTestCases() != null
                && !assignment.getTestSuite().getTestCases().isEmpty();

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setMarks(null);
        submission.setFeedback(null);

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

        // When a student submits, enqueue a test run so faculty/GA can see results for this submission.
        // Runs in its own transaction; failures here should not block the submission.
        try {
            // Ensure the new submission row is flushed so the separate transaction can see it.
            if (assignmentHasTests) {
                submissionRepository.flush();
                log.info("Student saved ID is: {}", saved.getId());
                testRunJobService.requestRunTests(saved.getId());
            } else {
                log.info("Skipping test run enqueue for submission {} because assignment {} has no test cases.",
                        saved.getId(), assignment.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to enqueue test run for submission {}: {}", saved.getId(), e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionForCurrentStudent(String userEmail, Long submissionId) {
        Users user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + userEmail));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        Assignment assignment = submission.getAssignment();
        if (assignment.getMainGroup() == null) {
            ensureStudentCanViewSubmissionForAssignment(student, submission);
            return mapToResponse(submission);
        }

        List<Long> subGroupStudentIds = getStudentIdsForRequesterSubGroup(assignment.getMainGroup(), student.getId());
        List<Submission> submissions = submissionRepository.findByAssignment_IdAndStudent_IdIn(assignment.getId(), subGroupStudentIds);
        if (submissions.isEmpty()) {
            throw new IllegalArgumentException("You are not assigned to a sub group for this assignment");
        }

        Submission latest = submissions.stream()
                .max(this::compareBySubmittedAt)
                .orElse(submission);

        ensureStudentCanViewSubmissionForAssignment(student, latest);
        return mapToResponse(latest);
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsForCurrentStudentByAssignment(String userEmail, Long assignmentId) {
        Users user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + userEmail));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (assignment.getMainGroup() == null) {
            List<Submission> submissions = submissionRepository.findByAssignment_IdAndStudent_Id(assignment.getId(), student.getId());
            return submissions.stream().map(this::mapToResponse).toList();
        }

        List<Long> subGroupStudentIds = getStudentIdsForRequesterSubGroupOrEmpty(assignment.getMainGroup(), student.getId());
        if (subGroupStudentIds.isEmpty()) {
            log.warn("Student {} requested submissions for grouped assignment {} but is not in any subgroup", student.getId(), assignmentId);
            return List.of();
        }

        return submissionRepository.findByAssignment_Id(assignment.getId()).stream()
                .filter(s -> subGroupStudentIds.contains(s.getStudent().getId()))
                .max(this::compareBySubmittedAt)
                .map(this::mapToResponse)
                .map(List::of)
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public List<SubmissionSummaryResponse> getSubmissionsForFacultyByAssignment(String facultyEmail, Long assignmentId) {
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (!assignment.getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to view submissions for this assignment");
        }

        List<Submission> submissions = submissionRepository.findByAssignment_Id(assignmentId);

        if (assignment.getMainGroup() == null) {
            // Non-grouped: surface latest submission per student.
            return submissions.stream()
                    .collect(Collectors.toMap(s -> s.getStudent().getId(), s -> s, this::pickLatest))
                    .values().stream()
                    .map(this::mapToSummaryResponse)
                    .toList();
        }

        // Grouped: surface latest submission per subgroup.
        Long mainGroupId = assignment.getMainGroup().getId();
        // Cache subgroup lookups by student to reduce queries.
        java.util.Map<Long, Long> studentToSubGroup = new java.util.HashMap<>();

        return submissions.stream()
                .flatMap(submission -> {
                    Long studentId = submission.getStudent().getId();
                    Long subGroupId = studentToSubGroup.computeIfAbsent(studentId, id ->
                            subGroupRepository.findByMainGroup_IdAndStudents_Id(mainGroupId, id)
                                    .map(SubGroup::getId)
                                    .orElse(null));
                    if (subGroupId == null) {
                        return java.util.stream.Stream.<java.util.Map.Entry<Long, Submission>>empty();
                    }
                    java.util.Map.Entry<Long, Submission> entry = new java.util.AbstractMap.SimpleEntry<>(subGroupId, submission);
                    return java.util.stream.Stream.of(entry);
                })
                .collect(Collectors.toMap(java.util.Map.Entry::getKey, java.util.Map.Entry::getValue, this::pickLatest))
                .values().stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionForFaculty(String facultyEmail, Long submissionId) {
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getAssignment().getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to view this submission");
        }
        Assignment assignment = submission.getAssignment();
        Submission latest = latestSubGroupSubmission(assignment, submission.getStudent().getId(), submission);
        return mapToResponse(latest);
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

        Submission target = latestSubGroupSubmission(submission.getAssignment(), submission.getStudent().getId(), submission);

        if (request.getMarks() != null) {
            target.setMarks(request.getMarks());
        }
        if (request.getFeedback() != null) {
            target.setFeedback(request.getFeedback());
        }
        target.setStatus(SubmissionStatus.GRADED);

        Submission saved = submissionRepository.save(target);
        try {
            sendGradeUpdatedEmail(saved);
        } catch (Exception e) {
            log.warn("Failed to send grade update email for submission {}: {}", saved.getId(), e.getMessage());
        }
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SubmissionSummaryResponse> getSubmissionsForGradingAssistantByAssignment(Long gradingAssistantUserId, Long assignmentId) {
        GradingAssistant gradingAssistant = gradingAssistantRepository.findByUserId(gradingAssistantUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found for user id: " + gradingAssistantUserId));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        validateGradingAssistantCourseAccess(gradingAssistant.getId(), assignment.getCourse().getId());

        List<Submission> submissions = submissionRepository.findByAssignment_Id(assignmentId);
        return submissions.stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionForGradingAssistant(Long gradingAssistantUserId, Long submissionId) {
        GradingAssistant gradingAssistant = gradingAssistantRepository.findByUserId(gradingAssistantUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found for user id: " + gradingAssistantUserId));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        validateGradingAssistantCourseAccess(gradingAssistant.getId(), submission.getAssignment().getCourse().getId());

        Submission latest = latestSubGroupSubmission(submission.getAssignment(), submission.getStudent().getId(), submission);
        return mapToResponse(latest);
    }

    @Transactional
    public SubmissionResponse updateGradeForSubmissionByGradingAssistant(Long gradingAssistantUserId, Long submissionId, SubmissionGradeRequest request) {
        GradingAssistant gradingAssistant = gradingAssistantRepository.findByUserId(gradingAssistantUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found for user id: " + gradingAssistantUserId));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        validateGradingAssistantCourseAccess(gradingAssistant.getId(), submission.getAssignment().getCourse().getId());

        Submission target = latestSubGroupSubmission(submission.getAssignment(), submission.getStudent().getId(), submission);

        if (request.getMarks() != null) {
            target.setMarks(request.getMarks());
        }
        if (request.getFeedback() != null) {
            target.setFeedback(request.getFeedback());
        }
        target.setStatus(SubmissionStatus.GRADED);

        Submission saved = submissionRepository.save(target);
        try {
            sendGradeUpdatedEmail(saved);
        } catch (Exception e) {
            log.warn("Failed to send grade update email for submission {}: {}", saved.getId(), e.getMessage());
        }
        return mapToResponse(saved);
    }

    private void sendGradeUpdatedEmail(Submission submission) {
        String email = submission.getStudent() != null
                && submission.getStudent().getUser() != null
                ? submission.getStudent().getUser().getEmail()
                : null;
        if (email == null || email.isBlank()) {
            return;
        }

        String subject = "Grade Updated: " + submission.getAssignment().getName();
        String content = String.format("""
                <p>Hello %s,</p>
                <p>Your grade has been updated for <strong>%s</strong> in course <strong>%s</strong>.</p>
                <h3>Grading Details</h3>
                <ul>
                    <li><strong>Assignment:</strong> %s</li>
                    <li><strong>Marks:</strong> %s</li>
                    <li><strong>Feedback:</strong> %s</li>
                    <li><strong>Status:</strong> %s</li>
                </ul>
                <p>Please log in to the Grade Forge portal to view full submission details.</p>
                """,
                submission.getStudent().getUser().getName() != null ? submission.getStudent().getUser().getName() : "Student",
                submission.getAssignment().getName(),
                submission.getAssignment().getCourse().getName(),
                submission.getAssignment().getName(),
                submission.getMarks() != null ? submission.getMarks() : "Not available",
                submission.getFeedback() != null && !submission.getFeedback().isBlank() ? submission.getFeedback() : "No feedback provided",
                submission.getStatus() != null ? submission.getStatus().name() : "UPDATED"
        );

        emailService.sendEmailsWithHtml(new String[]{email}, subject, content);
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
        SubGroup subGroup = null;
        if (submission.getAssignment().getMainGroup() != null) {
            subGroup = subGroupRepository.findByMainGroup_IdAndStudents_Id(
                    submission.getAssignment().getMainGroup().getId(), submission.getStudent().getId())
                    .orElse(null);
        }

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
                .status(submission.getStatus())
                .subGroupId(subGroup != null ? subGroup.getId() : null)
                .subGroupName(subGroup != null ? subGroup.getName() : null)
                .subGroupMembers(subGroup == null ? List.of() : subGroup.getStudents().stream()
                        .map(s -> GroupStudentResponse.builder()
                                .id(s.getId())
                                .name(s.getUser() != null ? s.getUser().getName() : null)
                                .email(s.getUser() != null ? s.getUser().getEmail() : null)
                                .cwid(s.getCwid())
                                .build())
                        .toList())
                .build();
    }

    private void ensureStudentCanViewSubmissionForAssignment(Student requester, Submission submission) {
        if (submission.getStudent().getId().equals(requester.getId())) {
            return; // always allow own submission
        }

        Assignment assignment = submission.getAssignment();
        MainGroup mainGroup = assignment.getMainGroup();
        if (mainGroup == null) {
            throw new IllegalArgumentException("You are not allowed to access this submission");
        }

        List<Long> subGroupStudentIds = getStudentIdsForRequesterSubGroup(mainGroup, requester.getId());
        if (!subGroupStudentIds.contains(submission.getStudent().getId())) {
            throw new IllegalArgumentException("You are not allowed to access this submission");
        }
    }

    private List<Long> getStudentIdsForRequesterSubGroup(MainGroup mainGroup, Long requesterStudentId) {
        SubGroup requesterGroup = subGroupRepository.findByMainGroup_IdAndStudents_Id(mainGroup.getId(), requesterStudentId)
                .orElseThrow(() -> new IllegalArgumentException("You are not assigned to a sub group for this assignment"));
        return requesterGroup.getStudents().stream()
                .map(Student::getId)
                .toList();
    }

    private List<Long> getStudentIdsForRequesterSubGroupOrEmpty(MainGroup mainGroup, Long requesterStudentId) {
        return subGroupRepository.findByMainGroup_IdAndStudents_Id(mainGroup.getId(), requesterStudentId)
                .map(SubGroup::getStudents)
                .map(students -> students.stream().map(Student::getId).toList())
                .orElse(List.of());
    }

    private SubmissionSummaryResponse mapToSummaryResponse(Submission submission) {
        return SubmissionSummaryResponse.builder()
                .submissionId(submission.getId())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getUser().getName())
                .studentEmail(submission.getStudent().getUser().getEmail())
                .grade(submission.getMarks())
                .feedback(submission.getFeedback())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    private int compareBySubmittedAt(Submission a, Submission b) {
        LocalDateTime ta = a.getSubmittedAt();
        LocalDateTime tb = b.getSubmittedAt();
        if (ta == null && tb == null) return 0;
        if (ta == null) return -1;
        if (tb == null) return 1;
        return ta.compareTo(tb);
    }

    private Submission pickLatest(Submission a, Submission b) {
        return compareBySubmittedAt(a, b) >= 0 ? a : b;
    }

    private Submission latestSubGroupSubmission(Assignment assignment, Long studentId, Submission fallback) {
        if (assignment.getMainGroup() == null) {
            return fallback;
        }
        List<Long> subGroupStudentIds = getStudentIdsForRequesterSubGroup(assignment.getMainGroup(), studentId);
        return submissionRepository.findByAssignment_IdAndStudent_IdIn(assignment.getId(), subGroupStudentIds).stream()
                .max(this::compareBySubmittedAt)
                .orElse(fallback);
    }

    private SubmissionFileResponse mapToFileResponse(SubmissionFile file) {
        return SubmissionFileResponse.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileKey(file.getFileKey())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .downloadUrl(fileStorageService.generatePresignedDownloadUrl(file.getFileKey(),file.getFileName()))
                .build();
    }

    private void validateGradingAssistantCourseAccess(Long gradingAssistantId, Long courseId) {
        boolean allowed = courseAssistantRepository.existsByGradingAssistant_IdAndCourse_Id(gradingAssistantId, courseId);
        if (!allowed) {
            throw new IllegalArgumentException("You are not allowed to access submissions for this assignment");
        }
    }

    /** Ensures the student (by email) can access the submission; throws if not. For run-tests. */
    @Transactional(readOnly = true)
    public void ensureStudentCanAccessSubmission(String userEmail, Long submissionId) {
        getSubmissionForCurrentStudent(userEmail, submissionId);
    }

    /** Ensures the faculty (by email) can access the submission; throws if not. For run-tests. */
    @Transactional(readOnly = true)
    public void ensureFacultyCanAccessSubmission(String facultyEmail, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));
        if (!submission.getAssignment().getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to access this submission");
        }
    }

    /** Ensures the grading assistant (by user id) can access the submission; throws if not. For run-tests. */
    @Transactional(readOnly = true)
    public void ensureGradingAssistantCanAccessSubmission(Long userId, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        GradingAssistant gradingAssistant = gradingAssistantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Grading assistant not found for user id: " + userId));
        validateGradingAssistantCourseAccess(gradingAssistant.getId(), submission.getAssignment().getCourse().getId());
    }
}
