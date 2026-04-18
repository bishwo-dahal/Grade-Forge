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
import com.grade.forge.submission.dto.AuthorshipTriageRequest;
import com.grade.forge.submission.dto.SubmissionFileResponse;
import com.grade.forge.submission.dto.SubmissionResponse;
import com.grade.forge.submission.dto.SubmissionGradeRequest;
import com.grade.forge.submission.dto.SubmissionSummaryResponse;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionAuthorshipTriage;
import com.grade.forge.submission.entity.SubmissionFile;
import com.grade.forge.submission.enums.SubmissionStatus;
import com.grade.forge.submission.repository.SubmissionAuthorshipTriageRepository;
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

import java.time.Instant;
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
    private final SubmissionAuthorshipTriageRepository submissionAuthorshipTriageRepository;
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

        return mapToResponse(saved, false);
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
            return mapToResponse(submission, false);
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
        return mapToResponse(latest, false);
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
            return submissions.stream().map(s -> mapToResponse(s, false)).toList();
        }

        List<Long> subGroupStudentIds = getStudentIdsForRequesterSubGroupOrEmpty(assignment.getMainGroup(), student.getId());
        if (subGroupStudentIds.isEmpty()) {
            log.warn("Student {} requested submissions for grouped assignment {} but is not in any subgroup", student.getId(), assignmentId);
            return List.of();
        }

        return submissionRepository.findByAssignment_Id(assignment.getId()).stream()
                .filter(s -> subGroupStudentIds.contains(s.getStudent().getId()))
                .max(this::compareBySubmittedAt)
                .map(s -> mapToResponse(s, false))
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
        return mapToResponse(latest, true);
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
        return mapToResponse(saved, true);
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
        return mapToResponse(latest, false);
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
        return mapToResponse(saved, false);
    }

    @Transactional
    public SubmissionResponse upsertAuthorshipTriage(String facultyEmail, Long submissionId, AuthorshipTriageRequest request) {
        Faculty faculty = facultyRepository.findByEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        if (!submission.getAssignment().getCourse().getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You are not allowed to label this submission");
        }

        Submission target = latestSubGroupSubmission(submission.getAssignment(), submission.getStudent().getId(), submission);

        if (request.getLabel() == null) {
            submissionAuthorshipTriageRepository.findBySubmission_IdAndFaculty_Id(target.getId(), faculty.getId())
                    .ifPresent(submissionAuthorshipTriageRepository::delete);
            return mapToResponse(target, true);
        }

        SubmissionAuthorshipTriage row = submissionAuthorshipTriageRepository
                .findBySubmission_IdAndFaculty_Id(target.getId(), faculty.getId())
                .orElse(null);
        if (row == null) {
            row = SubmissionAuthorshipTriage.builder()
                    .submission(target)
                    .faculty(faculty)
                    .label(request.getLabel())
                    .notes(request.getNotes())
                    .labeledAt(Instant.now())
                    .build();
        } else {
            row.setLabel(request.getLabel());
            row.setNotes(request.getNotes());
            row.setLabeledAt(Instant.now());
        }
        submissionAuthorshipTriageRepository.save(row);
        return mapToResponse(target, true);
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

        String studentName = submission.getStudent().getUser().getName() != null
                ? submission.getStudent().getUser().getName() : "Student";
        String assignmentName = submission.getAssignment().getName();
        String courseName = submission.getAssignment().getCourse().getName();
        String marks = submission.getMarks() != null
                ? submission.getMarks().toString() : "Not available";
        String feedback = submission.getFeedback() != null && !submission.getFeedback().isBlank()
                ? submission.getFeedback() : "No feedback provided";
        String status = submission.getStatus() != null
                ? submission.getStatus().name() : "UPDATED";

// Status color logic
        String statusColor = "#1a8b54";
        String statusBg = "#edfdf3";
        if (status.equals("FAILED") || status.equals("REJECTED")) {
            statusColor = "#8b1a2a"; statusBg = "#fdf0f1";
        } else if (status.equals("PENDING") || status.equals("UNDER_REVIEW")) {
            statusColor = "#b58d24"; statusBg = "#fdf8ed";
        }

        String content = String.format("""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">

<!-- HEADER -->
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0"
       style="background-color:#9A2236;">
  <tr>
    <td style="padding:44px 48px 38px;">

      <table role="presentation" width="100%%">
        <tr>
          <td width="60">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);
                        border-radius:12px;text-align:center;line-height:48px;">
              <img src="https://grade-forge.s3.us-east-2.amazonaws.com/email_logo/logo.png"
                   width="45" height="45" style="display:block;border:0;" />
            </div>
          </td>

          <td style="padding-left:16px;
                     color:#ffffff;
                     font-size:13px;
                     font-weight:600;
                     text-transform:uppercase;">
            Grade Forge · ULM
          </td>
        </tr>
      </table>

      <div style="margin-top:20px;
                  display:inline-block;
                  padding:5px 12px;
                  border-radius:20px;
                  border:1px solid rgba(255,255,255,0.3);
                  color:#ffffff;
                  font-size:11px;">
        %s
      </div>

      <h1 style="color:#ffffff;font-family:Georgia,serif;font-size:30px;margin-top:20px;">
        Grade <span style="color:#ffdcb4;">Updated</span>
      </h1>

    </td>
  </tr>
</table>

<!-- BODY -->
<table role="presentation" width="100%%">
  <tr>
    <td style="padding:44px 48px;">

      <p style="font-size:16px;color:#333;">Hello %s,</p>

      <p style="font-size:15px;color:#666;line-height:1.6;">
        Your submission for <strong>%s</strong> has been graded.
      </p>

      <!-- CARD -->
      <table role="presentation" width="100%%"
             style="margin-top:25px;border:1px solid #ddd;border-radius:10px;overflow:hidden;">

        <tr style="background-color:#9A2236;">
          <td style="padding:14px;color:#ffffff;font-size:12px;font-weight:bold;">
            Grading Details
          </td>
        </tr>

        <tr>
          <td style="padding:16px;">
            <div style="font-size:11px;color:#999;">Assignment</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Marks</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>

        <!-- STATUS -->
        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Status</div>

            <div style="display:inline-block;
                        margin-top:6px;
                        padding:6px 12px;
                        border-radius:20px;
                        font-size:12px;
                        font-weight:bold;
                        color:%s;
                        background:%s;
                        border:1px solid %s;">
              %s
            </div>

          </td>
        </tr>

      </table>

      <!-- FEEDBACK -->
      <table role="presentation" width="100%%" style="margin-top:25px;">
        <tr>
          <td style="padding:16px;
                     background:#f7f9ff;
                     border:1px solid #dde6f7;
                     border-left:4px solid #1a52a0;
                     border-radius:10px;
                     color:#444;
                     font-size:14px;
                     line-height:1.6;">
            <strong style="color:#1a52a0;">Instructor Feedback:</strong><br/>
            %s
          </td>
        </tr>
      </table>

      <!-- BUTTON -->
      <div style="text-align:center;margin-top:30px;">
        <a href="https://www.gradeforge.tech"
           style="display:inline-block;
                  background-color:#9A2236;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 36px;
                  border-radius:30px;
                  font-weight:bold;">
          View Submission →
        </a>
      </div>

    </td>
  </tr>
</table>

</body>
</html>
""",
                courseName,
                studentName,
                assignmentName,
                assignmentName,
                marks,
                statusColor,
                statusBg,
                statusColor,
                status,
                feedback
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

    private SubmissionResponse mapToResponse(Submission submission, boolean includeAuthorshipTriage) {
        SubGroup subGroup = null;
        if (submission.getAssignment().getMainGroup() != null) {
            subGroup = subGroupRepository.findByMainGroup_IdAndStudents_Id(
                    submission.getAssignment().getMainGroup().getId(), submission.getStudent().getId())
                    .orElse(null);
        }

        Long courseFacultyId = submission.getAssignment().getCourse().getFaculty().getId();
        SubmissionAuthorshipTriage triage = null;
        if (includeAuthorshipTriage) {
            triage = submissionAuthorshipTriageRepository.findBySubmission_IdAndFaculty_Id(submission.getId(), courseFacultyId)
                    .orElse(null);
        }

        SubmissionResponse.SubmissionResponseBuilder b = SubmissionResponse.builder()
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
                        .toList());
        if (triage != null) {
            b.authorshipTriageLabel(triage.getLabel())
                    .authorshipTriageNotes(triage.getNotes())
                    .authorshipTriageLabeledAt(triage.getLabeledAt());
        }
        return b.build();
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
