package com.grade.forge.programminglanguage.entity;

import com.grade.forge.assignment.entity.Assignment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "programming_languages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProgrammingLanguage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "docker_image", nullable = false)
    private String dockerImage;

    @Column(name = "execution_code", columnDefinition = "TEXT")
    private String executionCode;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "programmingLanguage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assignment;
}

