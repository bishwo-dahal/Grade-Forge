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
    private final FileStorageService fileStorageService;

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
            // Bulk JPQL delete so unkept rows are removed from assignment_starter_files (not only detached from session).
            if (keepIds.isEmpty()) {
                assignmentStarterFileRepository.deleteByAssignment_Id(saved.getId());
            } else {
                assignmentStarterFileRepository.deleteByAssignment_IdAndIdNotIn(saved.getId(), keepIds);
            }
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
}
