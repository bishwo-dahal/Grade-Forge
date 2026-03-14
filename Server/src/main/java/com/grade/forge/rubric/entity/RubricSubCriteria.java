package com.grade.forge.rubric.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(nullable = false)
    private Integer maxScore;

    private Double weight;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criteria_id", nullable = false)
    private RubricCriteria criteria;
}