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
import com.grade.forge.grade_reports.dto.StudentCourseStatsDTO;
import com.grade.forge.grade_reports.dto.StudentGradeDTO;
import com.grade.forge.grading.entity.SubmissionGrade;
import com.grade.forge.grading.repository.SubmissionGradeRepository;
import com.grade.forge.rubric.RubricType;
import com.grade.forge.rubric.entity.Rubric;
import com.grade.forge.rubric.entity.RubricSubCriteria;
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

    private static double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    /**
     * Converts rubric row grades into an assignment-level score.
     * - WEIGHTED rubric: sum((awarded/max)*(weight/100)*assignmentTotalPoints)
     * - UNWEIGHTED or missing rubric: sum(awardedScore)
     */
    private Double calculateRubricBackedScore(Assignment assignment, List<SubmissionGrade> grades) {
        if (grades == null || grades.isEmpty()) {
            return null;
        }

        final int assignmentTotalPoints = assignment.getTotalPoints() != null ? assignment.getTotalPoints() : 0;
        final Rubric rubric = assignment.getRubric();
        final boolean isWeighted = rubric != null && rubric.getRubricType() == RubricType.WEIGHTED;

        if (!isWeighted || assignmentTotalPoints <= 0) {
            double sum = grades.stream()
                    .filter(g -> g.getAwardedScore() != null)
                    .mapToDouble(SubmissionGrade::getAwardedScore)
                    .sum();
            return roundTo2(sum);
        }

        double sumWeightedPoints = 0.0;
        double sumAwardedFallback = 0.0;
        for (SubmissionGrade grade : grades) {
            if (grade.getAwardedScore() == null) {
                continue;
            }
            sumAwardedFallback += grade.getAwardedScore();

            RubricSubCriteria sub = grade.getRubricSubCriteria();
            if (sub == null) {
                continue;
            }
            Double max = sub.getMaxScore();
            Double weight = sub.getWeight();
            if (max == null || max <= 0 || weight == null) {
                continue;
            }
            // Clamp awarded to [0, max] to avoid accidental overshoots.
            double awarded = Math.max(0.0, Math.min(max, grade.getAwardedScore()));
            sumWeightedPoints += (awarded / max) * (weight / 100.0) * assignmentTotalPoints;
        }

        // If weights/maxScore missing on rubric rows, fall back to raw sum.
        double score = sumWeightedPoints > 0.0 ? sumWeightedPoints : sumAwardedFallback;
        // Cap to assignment total points.
        if (assignmentTotalPoints > 0) {
            score = Math.max(0.0, Math.min(assignmentTotalPoints, score));
        }
        return roundTo2(score);
    }

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
                    score = calculateRubricBackedScore(assignment, grades);
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
                score = calculateRubricBackedScore(assignment, grades);
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

    @Override
    public StudentCourseStatsDTO generateStudentCourseStats(Long courseId, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<Enrollment> enrollments = enrollmentRepository.findByCourse_Id(courseId).stream()
                .filter(e -> e.getStudent() != null && Objects.equals(e.getStudent().getId(), studentId))
                .toList();
        if (enrollments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student is not enrolled in this course");
        }
        Student student = enrollments.get(0).getStudent();

        List<Assignment> assignments = assignmentRepository.findByCourse_Id(courseId);
        int totalAssignments = assignments.size();

        LocalDateTime now = LocalDateTime.now();
        int submittedAssignments = 0;
        int gradedAssignments = 0;
        int missingAssignments = 0;
        int lateSubmissions = 0;

        // For last activity and trend we need latest submission per assignment.
        Submission lastSubmission = null;
        Assignment lastSubmissionAssignment = null;
        List<StudentCourseStatsDTO.TrendPointDTO> trend = new ArrayList<>();

        double gradedEarned = 0.0;
        double gradedTotal = 0.0;
        double allEarned = 0.0;
        double allTotal = 0.0;

        for (Assignment assignment : assignments) {
            List<Submission> subs = submissionRepository.findByAssignment_IdAndStudent_Id(assignment.getId(), studentId);
            Submission latest = subs.stream()
                    .max(Comparator.comparing(Submission::getSubmittedAt))
                    .orElse(null);

            final double maxScore = assignment.getTotalPoints() != null ? assignment.getTotalPoints().doubleValue() : 0.0;
            allTotal += maxScore;

            if (latest == null) {
                // Missing if past due date.
                String status = determineMissingStatus(assignment, now);
                if (STATUS_MISSING.equals(status)) {
                    missingAssignments += 1;
                }
                // includeMissing mode counts as 0 earned
                continue;
            }

            submittedAssignments += 1;

            if (lastSubmission == null || latest.getSubmittedAt().isAfter(lastSubmission.getSubmittedAt())) {
                lastSubmission = latest;
                lastSubmissionAssignment = assignment;
            }

            // Late determination uses dueDate (not lateDueDate) for now.
            if (assignment.getDueDate() != null && latest.getSubmittedAt() != null && latest.getSubmittedAt().isAfter(assignment.getDueDate())) {
                lateSubmissions += 1;
            }

            Double score = null;
            List<SubmissionGrade> grades = submissionGradeRepository.findBySubmission_Id(latest.getId());
            if (grades != null && !grades.isEmpty()) {
                score = calculateRubricBackedScore(assignment, grades);
            } else if (latest.getMarks() != null) {
                score = latest.getMarks();
            }

            if (score != null) {
                gradedAssignments += 1;
                double clamped = maxScore > 0 ? Math.max(0.0, Math.min(maxScore, score)) : score;
                gradedEarned += clamped;
                gradedTotal += maxScore;
                allEarned += clamped;
                trend.add(new StudentCourseStatsDTO.TrendPointDTO(
                        assignment.getId(),
                        assignment.getName(),
                        roundTo2(clamped),
                        roundTo2(maxScore),
                        latest.getSubmittedAt()
                ));
            } else {
                // Submitted but not graded: includeMissing counts as 0 earned.
            }
        }

        // Keep only most recent 8 graded items in trend.
        trend.sort(Comparator.comparing(StudentCourseStatsDTO.TrendPointDTO::getGradedAt).reversed());
        if (trend.size() > 8) {
            trend = trend.subList(0, 8);
        }

        int submissionRatePercent = totalAssignments > 0 ? (int) Math.round((submittedAssignments / (double) totalAssignments) * 100.0) : 0;

        int overallPercentGradedOnly = gradedTotal > 0 ? (int) Math.round((gradedEarned / gradedTotal) * 100.0) : 0;
        int overallPercentIncludingMissing = allTotal > 0 ? (int) Math.round((allEarned / allTotal) * 100.0) : 0;

        StudentCourseStatsDTO.LastActivityDTO lastActivity = null;
        if (lastSubmission != null && lastSubmissionAssignment != null) {
            lastActivity = new StudentCourseStatsDTO.LastActivityDTO(
                    lastSubmissionAssignment.getId(),
                    lastSubmissionAssignment.getName(),
                    lastSubmission.getSubmittedAt()
            );
        }

        return new StudentCourseStatsDTO(
                course.getId(),
                student.getId(),
                student.getUser() != null ? student.getUser().getName() : null,
                totalAssignments,
                submittedAssignments,
                gradedAssignments,
                missingAssignments,
                lateSubmissions,
                submissionRatePercent,
                overallPercentGradedOnly,
                overallPercentIncludingMissing,
                lastActivity,
                trend,
                0,
                0,
                null
        );
    }
}


