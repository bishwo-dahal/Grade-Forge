package com.grade.forge.rubric.entity;

import com.grade.forge.grading.entity.SubmissionGrade;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rubric_criteria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RubricCriteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer maxScore;

    private Double weight;

    // All grades for this criterion
    @OneToMany(mappedBy = "rubricCriteria")
    private List<SubmissionGrade> submissionGrades = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rubric_id", nullable = false)
    private Rubric rubric;
}

