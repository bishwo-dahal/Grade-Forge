package com.grade.forge.coursemgmt.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "course_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_key", nullable = false)
    private String fileKey;

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @OneToOne
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;
}
