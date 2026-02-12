package com.grade.forge.assignment.entity;

import com.grade.forge.assignment.enums.SubmissionType;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(optional = false)
    @JoinColumn(name = "language_id", nullable = false)
    private ProgrammingLanguage programmingLanguage;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_points", nullable = false)
    private Integer totalPoints;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_type", nullable = false)
    private SubmissionType submissionType;

    @Column(name = "starter_code_url")
    private String starterCodeUrl;

    @Column(name = "available_from")
    private LocalDateTime availableFrom;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "late_due_date")
    private LocalDateTime lateDueDate;
}

