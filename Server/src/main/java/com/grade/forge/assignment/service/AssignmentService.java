package com.grade.forge.assignment.service;

import com.grade.forge.assignment.dto.AssignmentBasicResponse;
import com.grade.forge.assignment.dto.AssignmentRequest;
import com.grade.forge.assignment.dto.AssignmentResponse;
import com.grade.forge.assignment.dto.AssignmentStarterFileResponse;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.entity.AssignmentStarterFile;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.assignment.repository.AssignmentStarterFileRepository;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.email.service.EmailService;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.group.entity.MainGroup;
import com.grade.forge.group.repository.MainGroupRepository;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.programminglanguage.repository.ProgrammingLanguageRepository;
import com.grade.forge.rubric.entity.Rubric;
import com.grade.forge.rubric.repository.RubricRepository;
import com.grade.forge.execution.repository.TestRunJobRepository;
import com.grade.forge.execution.repository.TestCaseResultRepository;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.repository.SubmissionRepository;
import com.grade.forge.submission.repository.SubmissionFileRepository;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.testsuite.entity.TestCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final ProgrammingLanguageRepository programmingLanguageRepository;
    private final RubricRepository rubricRepository;
    private final MainGroupRepository mainGroupRepository;
    private final TestRunJobRepository testRunJobRepository;
    private final TestCaseResultRepository testCaseResultRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final AssignmentStarterFileRepository assignmentStarterFileRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;

    public AssignmentResponse createAssignment(AssignmentRequest request, List<MultipartFile> files, String userEmail) {
        validateCreate(request);
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));
        ProgrammingLanguage language = programmingLanguageRepository.findById(request.getLanguageId())
                .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + request.getLanguageId()));

        if (!Objects.equals(course.getFaculty().getEmail(), userEmail)) {
            throw new IllegalArgumentException("You are not authorized to create assignments for this course");
        }

        Rubric rubric = null;
        if (request.getRubricId() != null) {
            rubric = rubricRepository.findById(request.getRubricId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rubric not found with id: " + request.getRubricId()));
            if (!Objects.equals(rubric.getFaculty().getId(), course.getFaculty().getId())) {
                throw new IllegalArgumentException("Rubric does not belong to the course faculty");
            }
        }

        Assignment assignment = mapToEntity(request, new Assignment());
        assignment.setCourse(course);
        assignment.setProgrammingLanguage(language);
        assignment.setRubric(rubric);
        if (request.getMainGroupId() != null) {
            MainGroup mainGroup = mainGroupRepository.findById(request.getMainGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Main group not found with id: " + request.getMainGroupId()));
            if (!Objects.equals(mainGroup.getCourse().getId(), course.getId())) {
                throw new IllegalArgumentException("Main group does not belong to the course");
            }
            assignment.setMainGroup(mainGroup);
        }

        Assignment saved = assignmentRepository.save(assignment);

        List<AssignmentStarterFile> starterFileEntities = fileStorageService.uploadAssignmentStarterFiles(saved, files);
        if (!starterFileEntities.isEmpty()) {
            assignmentStarterFileRepository.saveAll(starterFileEntities);
            saved.setStarterFiles(starterFileEntities);
        }


        // Send emails to all enrolled students (non-blocking)
        try {
            sendAssignmentNotificationEmails(saved);
        } catch (Exception e) {
            System.err.println("Failed to send assignment notification emails: " + e.getMessage());
        }


        return mapToResponse(saved);
    }

    public AssignmentResponse updateAssignment(Long id, AssignmentRequest request, List<MultipartFile> newFiles) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));
            assignment.setCourse(course);
        }
        // ensure we have the latest course reference for rubric validation
        Course currentCourse = assignment.getCourse();

        if (request.getLanguageId() != null) {
            ProgrammingLanguage language = programmingLanguageRepository.findById(request.getLanguageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Programming language not found with id: " + request.getLanguageId()));
            assignment.setProgrammingLanguage(language);
        }
        if (request.getName() != null) {
            assignment.setName(request.getName());
        }
        if (request.getDescription() != null) {
            assignment.setDescription(request.getDescription());
        }
        if (request.getTotalPoints() != null) {
            assignment.setTotalPoints(request.getTotalPoints());
        }
        if (request.getSubmissionType() != null) {
            assignment.setSubmissionType(request.getSubmissionType());
        }
        if (request.getAvailableFrom() != null) {
            assignment.setAvailableFrom(request.getAvailableFrom());
        }
        if (request.getDueDate() != null) {
            assignment.setDueDate(request.getDueDate());
        }
        if (request.getLateDueDate() != null) {
            assignment.setLateDueDate(request.getLateDueDate());
        }
        if (request.getRubricId() != null) {
            Rubric rubric = rubricRepository.findById(request.getRubricId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rubric not found with id: " + request.getRubricId()));
            if (!Objects.equals(rubric.getFaculty().getId(), currentCourse.getFaculty().getId())) {
                throw new IllegalArgumentException("Rubric does not belong to the course faculty");
            }
            assignment.setRubric(rubric);
        }
        if (request.getMainGroupId() != null) {
            MainGroup mainGroup = mainGroupRepository.findById(request.getMainGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Main group not found with id: " + request.getMainGroupId()));
            if (!Objects.equals(mainGroup.getCourse().getId(), currentCourse.getId())) {
                throw new IllegalArgumentException("Main group does not belong to the assignment's course");
            }
            assignment.setMainGroup(mainGroup);
        }

        validateTimeline(assignment.getAvailableFrom(), assignment.getDueDate(), assignment.getLateDueDate());

        Assignment saved = assignmentRepository.save(assignment);

        handleStarterFilesUpdate(saved, request, newFiles);

        Assignment refreshed = assignmentRepository.findById(saved.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + saved.getId()));
        return mapToResponse(refreshed);
    }

    /**
     * Updates starter files when {@code keepFileIds} is set and/or new {@code files} parts are sent.
     * If both are absent (keepFileIds null and no new files), existing starter files are unchanged.
     */
    private void handleStarterFilesUpdate(Assignment saved, AssignmentRequest request, List<MultipartFile> newFiles) {
        if (request.getKeepFileIds() == null && (newFiles == null || newFiles.isEmpty())) {
            return;
        }

        List<AssignmentStarterFile> existing = assignmentStarterFileRepository.findByAssignment_Id(saved.getId());
        // JSON numbers often deserialize as Integer; JPA ids are Long — normalize so contains() / removal works.
        List<Long> keepIds;
        if (request.getKeepFileIds() != null) {
            keepIds = request.getKeepFileIds().stream()
                    .filter(Objects::nonNull)
                    .map(id -> ((Number) id).longValue())
                    .toList();
        } else {
            keepIds = existing.stream()
                    .map(AssignmentStarterFile::getId)
                    .filter(Objects::nonNull)
                    .toList();
        }

        for (Long keepId : keepIds) {
            boolean known = existing.stream().anyMatch(f -> Objects.equals(f.getId(), keepId));
            if (!known) {
                throw new IllegalArgumentException("keepFileIds contains id not on this assignment: " + keepId);
            }
        }

        List<AssignmentStarterFile> toRemove = existing.stream()
                .filter(f -> keepIds.stream().noneMatch(k -> Objects.equals(k, f.getId())))
                .toList();

        if (!toRemove.isEmpty()) {
            fileStorageService.deleteObjects(toRemove.stream()
                    .map(AssignmentStarterFile::getFileKey)
                    .filter(Objects::nonNull)
                    .toList());
            List<Long> unkeptIds = toRemove.stream()
                    .map(AssignmentStarterFile::getId)
                    .filter(Objects::nonNull)
                    .toList();
            assignmentStarterFileRepository.deleteByAssignment_IdAndIdIn(saved.getId(), unkeptIds);
        }

        if (newFiles != null && !newFiles.isEmpty()) {
            List<AssignmentStarterFile> uploaded = fileStorageService.uploadAssignmentStarterFiles(saved, newFiles);
            if (!uploaded.isEmpty()) {
                assignmentStarterFileRepository.saveAll(uploaded);
            }
        }
    }

    public AssignmentResponse getAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return mapToResponse(assignment);
    }


    public List<AssignmentBasicResponse> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourse_Id(courseId).stream()
                .map(this::mapToBasicResponse)
                .collect(Collectors.toList());
    }

    public AssignmentResponse getAssignmentByCourse(Long courseId, Long assignmentId) {
        Assignment assignment = assignmentRepository.findByIdAndCourse_Id(assignmentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignment not found with id: " + assignmentId + " for course: " + courseId));
        return mapToResponse(assignment);
    }

    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        cleanupTestRunsAndResults(assignment);
        cleanupSubmissions(assignment);
        assignmentRepository.delete(assignment);
    }

    private void cleanupSubmissions(Assignment assignment) {
        List<Submission> submissions = submissionRepository.findByAssignment_Id(assignment.getId());
        if (submissions.isEmpty()) {
            return;
        }

        List<Long> submissionIds = submissions.stream()
                .map(Submission::getId)
                .filter(Objects::nonNull)
                .toList();

        if (!submissionIds.isEmpty()) {
            // Clean up test run jobs tied to these submissions (and their results) before deleting submissions/files.
            List<Long> testRunJobIds = testRunJobRepository.findBySubmission_IdIn(submissionIds).stream()
                    .map(trj -> trj.getId())
                    .filter(Objects::nonNull)
                    .toList();
            if (!testRunJobIds.isEmpty()) {
                testCaseResultRepository.deleteByTestRunJob_IdIn(testRunJobIds);
                testRunJobRepository.deleteByIdIn(testRunJobIds);
            }

            submissionFileRepository.deleteAllInBatch(
                    submissionFileRepository.findBySubmission_IdIn(submissionIds)
            );
        }

        submissionRepository.deleteAllInBatch(submissions);
    }

    private void cleanupTestRunsAndResults(Assignment assignment) {
        List<Long> testCaseIds = List.of();
        if (assignment.getTestSuite() != null && assignment.getTestSuite().getTestCases() != null) {
            testCaseIds = assignment.getTestSuite().getTestCases().stream()
                    .map(TestCase::getId)
                    .filter(Objects::nonNull)
                    .toList();
        }
        if (!testCaseIds.isEmpty()) {
            testCaseResultRepository.deleteByTestCase_IdIn(testCaseIds);
        }

        testRunJobRepository.deleteByAssignment_Id(assignment.getId());
    }

    private void validateCreate(AssignmentRequest request) {
        if (request.getCourseId() == null) {
            throw new IllegalArgumentException("courseId is required");
        }
        if (request.getLanguageId() == null) {
            throw new IllegalArgumentException("languageId is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Assignment name is required");
        }
        if (request.getTotalPoints() == null || request.getTotalPoints() < 0) {
            throw new IllegalArgumentException("totalPoints must be zero or positive");
        }
        if (request.getSubmissionType() == null) {
            throw new IllegalArgumentException("submissionType is required");
        }
        validateTimeline(request.getAvailableFrom(), request.getDueDate(), request.getLateDueDate());
    }

    private void validateTimeline(LocalDateTime availableFrom, LocalDateTime dueDate, LocalDateTime lateDueDate) {
        if (dueDate != null && availableFrom != null && dueDate.isBefore(availableFrom)) {
            throw new IllegalArgumentException("dueDate must be after availableFrom");
        }
        if (lateDueDate != null) {
            LocalDateTime compareFrom = dueDate != null ? dueDate : availableFrom;
            if (compareFrom != null && lateDueDate.isBefore(compareFrom)) {
                throw new IllegalArgumentException("lateDueDate must be after dueDate");
            }
        }
    }

    private Assignment mapToEntity(AssignmentRequest request, Assignment assignment) {
        assignment.setName(request.getName());
        assignment.setDescription(request.getDescription());
        assignment.setTotalPoints(request.getTotalPoints());
        assignment.setSubmissionType(request.getSubmissionType());
        assignment.setAvailableFrom(request.getAvailableFrom());
        assignment.setDueDate(request.getDueDate());
        assignment.setLateDueDate(request.getLateDueDate());
        return assignment;
    }

    private AssignmentResponse mapToResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourse().getId())
                .courseName(assignment.getCourse().getName())
                .languageId(assignment.getProgrammingLanguage().getId())
                .languageName(assignment.getProgrammingLanguage().getName())
                .languageAllowedExtensions(assignment.getProgrammingLanguage().getAllowedExtensions())
                .name(assignment.getName())
                .description(assignment.getDescription())
                .totalPoints(assignment.getTotalPoints())
                .submissionType(assignment.getSubmissionType())
                .starterCodeFiles(assignment.getStarterFiles() == null ? List.of() : assignment.getStarterFiles().stream()
                        .map(this::mapStarterFileToResponse)
                        .toList())
                .availableFrom(assignment.getAvailableFrom())
                .dueDate(assignment.getDueDate())
                .lateDueDate(assignment.getLateDueDate())
                .rubricId(assignment.getRubric() != null ? assignment.getRubric().getId() : null)
                .rubricName(assignment.getRubric() != null ? assignment.getRubric().getName() : null)
                .mainGroupId(assignment.getMainGroup() != null ? assignment.getMainGroup().getId() : null)
                .mainGroupName(assignment.getMainGroup() != null ? assignment.getMainGroup().getName() : null)
                .build();
    }

    private AssignmentBasicResponse mapToBasicResponse(Assignment assignment) {
        AssignmentBasicResponse response = new AssignmentBasicResponse();
        response.setId(assignment.getId());
        response.setCourseId(assignment.getCourse().getId());
        response.setName(assignment.getName());
        response.setDescription(assignment.getDescription());
        response.setTotalPoints(assignment.getTotalPoints());
        response.setAvailableFrom(assignment.getAvailableFrom());
        response.setDueDate(assignment.getDueDate());
        response.setLateDueDate(assignment.getLateDueDate());
        response.setLanguageName(assignment.getProgrammingLanguage() != null
                ? assignment.getProgrammingLanguage().getName()
                : null);
        return response;
    }

    private AssignmentStarterFileResponse mapStarterFileToResponse(AssignmentStarterFile file) {
        return AssignmentStarterFileResponse.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileKey(file.getFileKey())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .downloadUrl(fileStorageService.generatePresignedDownloadUrl(file.getFileKey(), file.getFileName()))
                .build();
    }

    private void sendAssignmentNotificationEmails(Assignment assignment) {
        // Get all enrolled students for the course
        List<Enrollment> enrolledStudents = enrollmentRepository.findByCourse_Id(assignment.getCourse().getId()).stream()
                .filter(enrollment -> EnrolledStatus.ENROLLED.equals(enrollment.getEnrolledStatus()))
                .toList();

        if (enrolledStudents.isEmpty()) {
            return;
        }

        // Extract email addresses from enrolled students
        String[] recipientEmails = enrolledStudents.stream()
                .map(enrollment -> enrollment.getStudent().getUser().getEmail())
                .toArray(String[]::new);

        // Prepare email content
        String subject = "New Assignment: " + assignment.getName() + " Course: " + assignment.getCourse().getName();

        String courseName     = assignment.getCourse().getName();
        String assignmentName = assignment.getName();
        String description    = assignment.getDescription() != null
                ? assignment.getDescription() : "No description provided";
        String totalPoints    = String.valueOf(assignment.getTotalPoints());


      final java.time.format.DateTimeFormatter humanDateTime =
              java.time.format.DateTimeFormatter.ofPattern("MMMM d yyyy h:mm a");
      String availableFrom = assignment.getAvailableFrom() != null
              ? assignment.getAvailableFrom().format(humanDateTime) : "Not specified";
      String dueDate = assignment.getDueDate() != null
              ? assignment.getDueDate().format(humanDateTime) : "Not specified";

        String countdown;
        if (assignment.getDueDate() == null) {
            countdown = "No deadline";
        } else {
            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                    java.time.LocalDate.now(),
                    assignment.getDueDate().toLocalDate()
            );

            if (daysRemaining > 1) {
                countdown = daysRemaining + " days";
            } else if (daysRemaining == 1) {
                countdown = "1 day";
            } else if (daysRemaining == 0) {
                countdown = "today";
            } else {
                countdown = Math.abs(daysRemaining) + " days ago";
            }
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
          <td width="60" valign="middle">
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
                     letter-spacing:0.12em;
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

      <h1 style="color:#ffffff;
                 font-family:Georgia,serif;
                 font-size:30px;
                 margin-top:20px;">
        New Assignment <span style="color:#ffdcb4;">Posted</span>
      </h1>

    </td>
  </tr>
</table>

<!-- BODY -->
<table role="presentation" width="100%%">
  <tr>
    <td style="padding:44px 48px;">

      <p style="font-size:16px;color:#333;">Hello Class,</p>

      <p style="font-size:15px;color:#666;line-height:1.6;">
        A new assignment has been posted for <strong>%s</strong>.
        Please review details below.
      </p>

      <!-- CARD -->
      <table role="presentation" width="100%%"
             style="margin-top:25px;border:1px solid #ddd;border-radius:10px;overflow:hidden;">

        <tr style="background-color:#9A2236;">
          <td style="padding:14px;color:#ffffff;font-size:12px;font-weight:bold;">
            Assignment Details
          </td>
        </tr>

        <tr>
          <td style="padding:16px;">
            <div style="font-size:11px;color:#999;">Title</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Description</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Total Points</div>
            <div style="font-size:14px;color:#222;">%s pts</div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Available From</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px;border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">Due Date</div>
            <div style="font-size:14px;color:#222;">%s</div>
          </td>
        </tr>

      </table>

      <!-- DEADLINE -->
      <table role="presentation" width="100%%" style="margin-top:25px;">
        <tr>
          <td style="padding:16px;
                     background:#fff8ee;
                     border:1px solid #f5d89a;
                     border-radius:10px;
                     color:#7a5000;
                     font-size:13px;">
            <strong>Deadline:</strong> Within %s
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
          Open Assignment →
        </a>
      </div>

    </td>
  </tr>
</table>

</body>
</html>
""",
                courseName,
                courseName,
                assignmentName,
                description,
                totalPoints,
                availableFrom,
                dueDate,
                countdown
        );




        emailService.sendEmailsWithHtml(recipientEmails, subject, content);
    }
}
