package com.grade.forge.testsuite.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "test_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "is_private", nullable = false)
    private Boolean isPrivate = false;

    @Column(name = "console_input", columnDefinition = "TEXT")
    private String consoleInput;

    @Column(name = "file_input", columnDefinition = "TEXT")
    private String fileInput;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String output;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_suite_id", nullable = false)
    private TestSuite testSuite;
}
