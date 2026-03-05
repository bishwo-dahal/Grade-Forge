package com.grade.forge.execution.entity;

import com.grade.forge.execution.enums.TestRunJobStatus;
import com.grade.forge.submission.entity.Submission;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_run_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestRunJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TestRunJobStatus status = TestRunJobStatus.QUEUED;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @OneToMany(mappedBy = "testRunJob", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCaseResult> testCaseResults = new ArrayList<>();
}
