package com.grade.forge.testsuite.entity;

import com.grade.forge.assignment.entity.Assignment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_suites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestSuite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false, unique = true)
    private Assignment assignment;

    @OneToMany(mappedBy = "testSuite", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCase> testCases = new ArrayList<>();
}
