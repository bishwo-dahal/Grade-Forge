package com.grade.forge.grade_reports.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import com.grade.forge.grade_reports.dto.AssignmentGradeDTO;
import com.grade.forge.grade_reports.dto.AssignmentReportResponseDTO;
import com.grade.forge.grade_reports.dto.GradeReportResponseDTO;
import com.grade.forge.grade_reports.dto.StudentAssignmentStatusDTO;
import com.grade.forge.grade_reports.dto.StudentGradeDTO;
import com.grade.forge.grading.entity.SubmissionGrade;
import com.grade.forge.grading.repository.SubmissionGradeRepository;
import com.grade.forge.student.entity.Student;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeReportServiceImpl implements GradeReportService {

    private static final String STATUS_GRADED = "GRADED";
    private static final String STATUS_UNGRADED = "UNGRADED";
    private static final String STATUS_MISSING = "MISSING";
    private static final String STATUS_NOT_SUBMITTED = "NOT_SUBMITTED";

    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionGradeRepository submissionGradeRepository;

    @Override
    public GradeReportResponseDTO generateGradeReport(Long courseId, List<Long> studentIds, List<Long> assignmentIds) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<Assignment> assignments = assignmentRepository.findByCourse_Id(courseId);
        if (assignmentIds != null && !assignmentIds.isEmpty()) {
            Set<Long> requestedAssignmentIds = assignmentIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
            assignments = assignments.stream()
                    .filter(assignment -> requestedAssignmentIds.contains(assignment.getId()))
                    .toList();
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourse_Id(courseId);
        if (studentIds != null && !studentIds.isEmpty()) {
            Set<Long> requestedStudentIds = studentIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
            enrollments = enrollments.stream()
                    .filter(enrollment -> requestedStudentIds.contains(enrollment.getStudent().getId()))
                    .toList();
        }

        Map<Long, Map<Long, Submission>> submissionsByAssignment = preloadSubmissions(assignments);
        LocalDateTime now = LocalDateTime.now();
        List<StudentGradeDTO> studentGrades = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            List<AssignmentGradeDTO> assignmentGrades = new ArrayList<>();
            double totalScore = 0.0;

            for (Assignment assignment : assignments) {
                AssignmentGradeDTO assignmentGrade = buildAssignmentGrade(student, assignment, submissionsByAssignment, now);
                assignmentGrades.add(assignmentGrade);
                if (assignmentGrade.getScore() != null) {
                    totalScore += assignmentGrade.getScore();
                }
            }

            StudentGradeDTO studentGradeDTO = new StudentGradeDTO(
                    student.getId(),
                    student.getUser() != null ? student.getUser().getName() : null,
                    totalScore,
                    assignmentGrades
            );
            studentGrades.add(studentGradeDTO);
        }

        return new GradeReportResponseDTO(course.getId(), course.getName(), studentGrades);
    }

    @Override
    public AssignmentReportResponseDTO generateAssignmentReport(Long courseId, Long assignmentId, List<Long> studentIds) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        Assignment assignment = assignmentRepository.findByIdAndCourse_Id(assignmentId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found for course"));

        List<Enrollment> enrollments = enrollmentRepository.findByCourse_Id(courseId);
        if (studentIds != null && !studentIds.isEmpty()) {
            Set<Long> requestedStudentIds = studentIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
            enrollments = enrollments.stream()
                    .filter(enrollment -> requestedStudentIds.contains(enrollment.getStudent().getId()))
                    .toList();
        }

        Map<Long, Submission> submissions = submissionRepository.findByAssignment_Id(assignment.getId()).stream()
                .filter(submission -> submission.getStudent() != null)
                .collect(Collectors.toMap(
                        submission -> submission.getStudent().getId(),
                        submission -> submission,
                        (existing, replacement) -> existing.getSubmittedAt().isAfter(replacement.getSubmittedAt()) ? existing : replacement
                ));

        LocalDateTime now = LocalDateTime.now();
        List<StudentAssignmentStatusDTO> studentStatuses = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            Submission submission = submissions.get(student.getId());

            if (submission != null) {
                List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(submission.getId());
                Double score = null;
                if (!grades.isEmpty()) {
                    score = grades.stream()
                            .filter(grade -> grade.getAwardedScore() != null)
                            .mapToDouble(SubmissionGrade::getAwardedScore)
                            .sum();
                } else if (submission.getMarks() != null) {
                    score = submission.getMarks();
                }
                String status = score != null ? STATUS_GRADED : STATUS_UNGRADED;
                studentStatuses.add(new StudentAssignmentStatusDTO(
                        student.getId(),
                        student.getUser() != null ? student.getUser().getName() : null,
                        score,
                        assignment.getTotalPoints() != null ? assignment.getTotalPoints().doubleValue() : null,
                        status
                ));
            } else {
                String status = determineMissingStatus(assignment, now);
                studentStatuses.add(new StudentAssignmentStatusDTO(
                        student.getId(),
                        student.getUser() != null ? student.getUser().getName() : null,
                        null,
                        assignment.getTotalPoints() != null ? assignment.getTotalPoints().doubleValue() : null,
                        status
                ));
            }
        }

        studentStatuses.sort(Comparator.comparing(StudentAssignmentStatusDTO::getStudentId));
        return new AssignmentReportResponseDTO(course.getId(), assignment.getId(), assignment.getName(), studentStatuses);
    }

    private Map<Long, Map<Long, Submission>> preloadSubmissions(List<Assignment> assignments) {
        Map<Long, Map<Long, Submission>> submissionsByAssignment = new HashMap<>();
        for (Assignment assignment : assignments) {
            List<Submission> submissions = submissionRepository.findByAssignment_Id(assignment.getId());
            Map<Long, Submission> latestByStudent = submissions.stream()
                    .filter(submission -> submission.getStudent() != null)
                    .collect(Collectors.toMap(
                            submission -> submission.getStudent().getId(),
                            submission -> submission,
                            (existing, replacement) -> existing.getSubmittedAt().isAfter(replacement.getSubmittedAt()) ? existing : replacement
                    ));
            submissionsByAssignment.put(assignment.getId(), latestByStudent);
        }
        return submissionsByAssignment;
    }

    private AssignmentGradeDTO buildAssignmentGrade(Student student,
                                                   Assignment assignment,
                                                   Map<Long, Map<Long, Submission>> submissionsByAssignment,
                                                   LocalDateTime now) {
        Map<Long, Submission> assignmentSubmissions = submissionsByAssignment.getOrDefault(assignment.getId(), Map.of());
        Submission submission = assignmentSubmissions.get(student.getId());

        if (submission != null) {
            List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(submission.getId());
            Double score = null;
            if (!grades.isEmpty()) {
                score = grades.stream()
                        .filter(grade -> grade.getAwardedScore() != null)
                        .mapToDouble(SubmissionGrade::getAwardedScore)
                        .sum();
            } else if (submission.getMarks() != null) {
                score = submission.getMarks();
            }
            String status = score != null ? STATUS_GRADED : STATUS_UNGRADED;
            return new AssignmentGradeDTO(
                    assignment.getId(),
                    assignment.getName(),
                    score,
                    assignment.getTotalPoints() != null ? assignment.getTotalPoints().doubleValue() : null,
                    status
            );
        }

        String status = determineMissingStatus(assignment, now);
        return new AssignmentGradeDTO(
                assignment.getId(),
                assignment.getName(),
                null,
                assignment.getTotalPoints() != null ? assignment.getTotalPoints().doubleValue() : null,
                status
        );
    }

    private String determineMissingStatus(Assignment assignment, LocalDateTime now) {
        LocalDateTime dueDate = assignment.getDueDate();
        if (dueDate != null && dueDate.isBefore(now)) {
            return STATUS_MISSING;
        }
        return STATUS_NOT_SUBMITTED;
    }
}


