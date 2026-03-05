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

    /**
     * Optional command to compile the submission before execution (e.g. "javac {{main_file}}").
     * May contain placeholders: {{main_file}} (entry filename), {{main_class}} (filename without extension).
     * Stored as-is; the runner substitutes placeholders at execution time.
     */
    @Column(name = "compile_command", columnDefinition = "TEXT")
    private String compileCommand;

    /**
     * Command to run the submission (e.g. "java {{main_class}}" or "python3 {{main_file}}").
     * May contain placeholders: {{main_file}}, {{main_class}}. The runner substitutes them at execution time.
     */
    @Column(name = "execution_code", columnDefinition = "TEXT")
    private String executionCode;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "programmingLanguage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assignment;
}

