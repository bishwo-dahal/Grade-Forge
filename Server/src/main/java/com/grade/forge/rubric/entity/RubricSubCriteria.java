package com.grade.forge.rubric.entity;

import jakarta.persistence.*;

@Entity
public class RubricSubCriteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    private Double points;

    @ManyToOne
    @JoinColumn(name = "criteria_id")
    private RubricCriteria criteria;
}