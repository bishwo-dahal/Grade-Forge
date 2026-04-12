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
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
   
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      .email-header {
        background: linear-gradient(135deg, #6b0f1a 0%%, #8b1a2a 40%%, #a0243a 100%%);
        padding: 44px 48px 38px;
        position: relative;
        overflow: hidden;
      }
      .email-header::before {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(ellipse 70%% 80%% at 90%% 10%%, rgba(255,255,255,0.08) 0%%, transparent 60%%);
      }
      .header-top { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; position: relative; }
      .logo-mark {
        width: 48px; height: 48px;
        background: rgba(255,255,255,0.15);
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
      }
      .logo-mark svg { width: 26px; height: 26px; fill: #fff; }
      .brand-name {
        color: rgba(255,255,255,0.9);
        font-size: 13px; font-weight: 600;
        letter-spacing: 0.12em; text-transform: uppercase;
      }
      .course-badge {
        display: inline-block;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.75);
        font-size: 11px; font-weight: 500;
        letter-spacing: 0.1em; text-transform: uppercase;
        padding: 5px 12px; border-radius: 20px;
        margin-bottom: 12px; position: relative;
      }
      .email-header h1 {
        font-family: Georgia, serif;
        font-size: 30px; font-weight: 700;
        color: #ffffff; line-height: 1.25; position: relative;
      }
      .email-header h1 span { color: rgba(255,220,180,0.9); }
      .email-body { padding: 44px 48px 36px; background: #fff; font-family: Arial, sans-serif; }
      .greeting { font-size: 16px; color: #333; font-weight: 400; margin-bottom: 8px; }
      .intro { font-size: 15px; color: #666; line-height: 1.65; margin-bottom: 36px; }
      .details-card {
        background: #fafafa; border: 1px solid #ebebeb;
        border-radius: 16px; overflow: hidden; margin-bottom: 32px;
      }
      .details-card-header {
        background: linear-gradient(90deg, #8b1a2a, #a0243a);
        padding: 14px 24px; display: flex; align-items: center; gap: 10px;
      }
      .details-card-header svg { width: 16px; height: 16px; fill: rgba(255,255,255,0.8); flex-shrink: 0; }
      .details-card-header span {
        font-size: 11.5px; font-weight: 600;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: rgba(255,255,255,0.9);
      }
      .detail-row {
        padding: 16px 24px;
        border-bottom: 1px solid #ebebeb;
      }
      .detail-row:last-child { border-bottom: none; }
      .detail-label {
        font-size: 11px; font-weight: 600;
        letter-spacing: 0.08em; text-transform: uppercase;
        color: #999; margin-bottom: 4px;
      }
      .detail-value { font-size: 14.5px; color: #222; font-weight: 500; }
      .deadline-banner {
        background: linear-gradient(135deg, #fff8ee, #fff3e0);
        border: 1px solid #f5d89a;
        border-radius: 12px;
        padding: 18px 22px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 32px;
      }
     
      .deadline-text { font-size: 13.5px; color: #7a5000; line-height: 1.5; }
      .deadline-text strong { font-weight: 700; }
      .cta-section { text-align: center; margin-bottom: 32px; }
      .cta-btn {
        display: inline-block;
        background: linear-gradient(135deg, #6b0f1a 0%%, #a0243a 100%%);
        color: #FFFFFF; text-decoration: none;
        font-size: 14px; font-weight: 600; letter-spacing: 0.04em;
        padding: 15px 36px; border-radius: 50px;
        box-shadow: 0 6px 24px rgba(107,15,26,0.30);
      }
      .cta-sub { margin-top: 10px; font-size: 12.5px; color: #aaa; }
    </style>
    </head>
<body>
    <div class="email-header">
     <div class="header-top">
                    <div class="logo-mark">
                      <img src="https://grade-forge.s3.us-east-2.amazonaws.com/email_logo/logo.png" width="48" height="44" alt="Grade Forge">
                    </div>
                    <div class="brand-name"> &nbsp; Grade Forge · ULM</div>
                  </div>
      <div class="course-badge">%s</div>
      <h1>New Assignment <span>Posted</span></h1>
    </div>

    <div class="email-body">
      <p class="greeting">Hello Class,</p>
      <p class="intro">A new assignment has been posted for your course <strong>%s</strong>. Review the details below and submit your work before the deadline.</p>

      <div class="details-card">
        <div class="details-card-header">
          <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
          <span>Assignment Details</span>
        </div>

        <div class="detail-row">
          <div class="detail-label">Title</div>
          <div class="detail-value">%s</div>
        </div>

        <div class="detail-row">
          <div class="detail-label">Description</div>
          <div class="detail-value">%s</div>
        </div>

        <div class="detail-row">
          <div class="detail-label">Total Points</div>
          <div class="detail-value">%s pts</div>
        </div>

        <div class="detail-row">
          <div class="detail-label">Available From</div>
          <div class="detail-value">%s</div>
        </div>

        <div class="detail-row">
          <div class="detail-label">Due Date</div>
          <div class="detail-value">%s</div>
        </div>
      </div>

      <div class="deadline-banner">
       
        <div class="deadline-text">
          <strong>Submission Deadline:</strong> Within %s &ndash; log in to the portal and submit before time runs out.
        </div>
      </div>

      <div class="cta-section">
        <a href="http://52.14.92.121:8080"    style="display:inline-block;
                                                      background:linear-gradient(135deg,#6b0f1a,#a0243a);
                                                      color:#ffffff !important;
                                                      text-decoration:none !important;
                                                      font-size:14px;
                                                      font-weight:600;
                                                      letter-spacing:0.04em;
                                                      padding:15px 36px;
                                                      border-radius:50px;
                                                      box-shadow:0 6px 24px rgba(107,15,26,0.30);
                                                      mso-style-priority:100;">
                                                      
                                                      Open Assignment →</a>
        <p class="cta-sub">Log in to Grade Forge to view full details &amp; submit</p>
      </div>
    </div>
     </body>
    </html>
    """,
                courseName,       // course-badge
                courseName,       // intro strong
                assignmentName,   // Title row
                description,      // Description row
                totalPoints,      // Total Points row
                availableFrom,    // Available From row
                dueDate,          // Due Date row
                countdown          // deadline banner
        );

        emailService.sendEmailsWithHtml(recipientEmails, subject, content);
    }
}
