package com.grade.forge.coursemgmt.entity;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.semester.entity.Semester;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

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

    @Column(name = "course_code")
    private String courseCode;    // Course code

    private String section;       // A, B (optional)

    private String description;   // Optional course description

    @Column(name = "image_url")
    private String imageUrl;      // Optional image URL

    @Column(name = "canvas_course_id")
    private String canvasCourseId;// External LMS id


    @Builder.Default
    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    private Boolean active = true;


    @Builder.Default
    @Column(name = "is_published", nullable = false, columnDefinition = "boolean default false")
    private Boolean isPublished = true;


    // Many courses belong to one semester
    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @ManyToOne
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;


    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assignment;

}
