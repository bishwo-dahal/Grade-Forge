package com.grade.forge.courseassistant.entity;

import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "course_assistants",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"ga_id", "course_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseAssistant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ga_id", nullable = false)
    private GradingAssistant gradingAssistant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}
