package com.grade.forge.rubric.entity;


import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.rubric.RubricType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rubrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Rubric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Enumerated(EnumType.STRING)
    private RubricType rubricType; // WEIGHTED or UNWEIGHTED

    @OneToMany(mappedBy = "rubric", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RubricCriteria> criteria = new ArrayList<>();
}
