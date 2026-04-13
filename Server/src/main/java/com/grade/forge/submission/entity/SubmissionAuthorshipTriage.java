package com.grade.forge.submission.entity;

import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.submission.enums.AuthorshipTriageLabel;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "submission_authorship_triage",
    uniqueConstraints = @UniqueConstraint(name = "uk_submission_faculty_triage", columnNames = {"submission_id", "faculty_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionAuthorshipTriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AuthorshipTriageLabel label;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "labeled_at", nullable = false)
    private Instant labeledAt = Instant.now();
}
