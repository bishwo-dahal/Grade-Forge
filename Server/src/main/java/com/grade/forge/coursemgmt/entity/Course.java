package com.grade.forge.coursemgmt.entity;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.courseassistant.entity.CourseAssistant;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.group.entity.MainGroup;
import com.grade.forge.semester.entity.Semester;
import com.grade.forge.enrollment.entity.Enrollment;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
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


//    One Course will have many Assignments
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assignment;


//    For Students, we will have a separate entity Enrollment that links a Student to a Course. This allows us to manage the many-to-many relationship between courses and students, as a course can have multiple students enrolled and a student can enroll in multiple courses.
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Enrollment> enrollments = new ArrayList<>();


//    For Grading Assistants, we will have a separate entity CourseAssistant that links a Grading Assistant to a Course. This allows us to manage the many-to-many relationship between courses and grading assistants, as a course can have multiple grading assistants and a grading assistant can assist with multiple courses.
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CourseAssistant> assistants = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MainGroup> mainGroups = new ArrayList<>();

    @OneToOne(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private CourseImage courseImage;

}
