package com.grade.forge.execution.entity;

import com.grade.forge.testsuite.entity.TestCase;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "test_case_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_run_job_id", nullable = false)
    private TestRunJob testRunJob;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @Column(nullable = false)
    private Boolean passed;

    @Column(name = "actual_output", columnDefinition = "TEXT")
    private String actualOutput;

    @Column(name = "timed_out", nullable = false)
    private Boolean timedOut = false;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "runtime_ms")
    private Long runtimeMs;
}
