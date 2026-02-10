package com.grade.forge.classmgmt.entity;

import com.grade.forge.faculty.entity.Faculty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courses")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;          // CS101, Math-1
    private String section;       // A, B (optional)
    private String semester;      // Fall 2026

    @Builder.Default
    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    private Boolean active = true;

    @ManyToOne
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;


}

