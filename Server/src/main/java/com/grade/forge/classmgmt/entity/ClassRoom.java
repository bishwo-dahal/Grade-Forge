package com.grade.forge.classmgmt.entity;

import com.grade.forge.university.entity.University;
import com.grade.forge.user.entity.Users;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "classrooms")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ClassRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;          // CS101, Math-1
    private String section;       // A, B (optional)
    private String semester;      // Fall 2026
    private boolean active;

}

