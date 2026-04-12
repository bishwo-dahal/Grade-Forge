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

    @Column(name = "docker_image", columnDefinition = "TEXT", nullable = false)
    private String dockerImage;

    @Column(name = "compile_command", columnDefinition = "TEXT")
    private String compileCommand;

    @Column(name = "execution_code", columnDefinition = "TEXT")
    private String executionCode;

    /**
     * Comma-separated list of allowed source file extensions for this language (e.g. ".java,.txt,.csv").
     * Used to validate uploaded submission files per assignment language. Text/CSV are always allowed in addition.
     */
    @Column(name = "allowed_extensions", columnDefinition = "TEXT")
    private String allowedExtensions;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "programmingLanguage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assignment;
}

