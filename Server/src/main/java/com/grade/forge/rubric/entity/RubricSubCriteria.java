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
@Table(name = "rubric_sub_criteria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RubricSubCriteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;


    private Integer maxScore;

    private Double weight;

    // All grades for this criterion
    @OneToMany(mappedBy = "rubricSubCriteria")
    private List<SubmissionGrade> submissionGrades = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criteria_id", nullable = false)
    private RubricCriteria criteria;
}