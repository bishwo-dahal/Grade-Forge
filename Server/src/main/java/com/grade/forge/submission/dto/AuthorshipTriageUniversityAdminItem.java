package com.grade.forge.submission.dto;

import com.grade.forge.submission.enums.AuthorshipTriageLabel;
import lombok.Getter;

import java.time.Instant;

/**
 * Read-only row for university admins: faculty authorship triage labels aggregated for ML / compliance review.
 */
@Getter
public class AuthorshipTriageUniversityAdminItem {

    private final Long submissionId;
    private final Long studentId;
    private final String studentName;
    private final Long assignmentId;
    private final String assignmentName;
    private final Long courseId;
    private final String courseName;
    private final String courseCode;
    private final Long facultyId;
    private final String facultyName;
    private final String facultyEmail;
    private final AuthorshipTriageLabel label;
    private final Instant labeledAt;
    private final String notes;

    public AuthorshipTriageUniversityAdminItem(
            Long submissionId,
            Long studentId,
            String studentName,
            Long assignmentId,
            String assignmentName,
            Long courseId,
            String courseName,
            String courseCode,
            Long facultyId,
            String facultyName,
            String facultyEmail,
            AuthorshipTriageLabel label,
            Instant labeledAt,
            String notes
    ) {
        this.submissionId = submissionId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.assignmentId = assignmentId;
        this.assignmentName = assignmentName;
        this.courseId = courseId;
        this.courseName = courseName;
        this.courseCode = courseCode;
        this.facultyId = facultyId;
        this.facultyName = facultyName;
        this.facultyEmail = facultyEmail;
        this.label = label;
        this.labeledAt = labeledAt;
        this.notes = notes;
    }
}
