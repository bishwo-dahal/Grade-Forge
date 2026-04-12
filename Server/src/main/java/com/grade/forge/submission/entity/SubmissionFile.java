package com.grade.forge.submission.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "submission_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName; // original name

    @Column(name = "file_key", nullable = false)
    private String fileKey; // S3 object key

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @ManyToOne(optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;
}
