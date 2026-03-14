package com.grade.forge.grading.entity;

import com.grade.forge.rubric.entity.RubricSubCriteria;
import com.grade.forge.submission.entity.Submission;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "submission_grades")
@Getter
@Setter
public class SubmissionGrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rubric_sub_criteria_id", nullable = false)
    private RubricSubCriteria rubricSubCriteria;

    @Column(name = "awarded_score", nullable = false)
    private Double awardedScore;

    @Column(columnDefinition = "TEXT")
    private String feedback;
}

