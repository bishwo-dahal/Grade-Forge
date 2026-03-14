package com.grade.forge.rubric.entity;

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



    @OneToMany(mappedBy = "criteria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RubricSubCriteria> subCriteria = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rubric_id", nullable = false)
    private Rubric rubric;

    public void addSubCriteria(RubricSubCriteria subCriteria) {
        if (subCriteria == null) {
            return;
        }
        subCriteria.setCriteria(this);
        this.subCriteria.add(subCriteria);
    }
}

