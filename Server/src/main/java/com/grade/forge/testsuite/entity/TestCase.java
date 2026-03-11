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

    /** Input content: stdin if file_name is null, else file content. */
    @Column(name = "input", columnDefinition = "TEXT")
    private String input;

    /** If set, input is file content (create file with this name when running). If null, input is console/stdin. */
    @Column(name = "file_name")
    private String fileName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String output;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_suite_id", nullable = false)
    private TestSuite testSuite;
}
