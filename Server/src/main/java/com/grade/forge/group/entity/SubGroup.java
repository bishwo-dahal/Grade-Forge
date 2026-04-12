package com.grade.forge.group.entity;

import com.grade.forge.student.entity.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sub_group", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"main_group_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "main_group_id", nullable = false)
    private MainGroup mainGroup;

    @Builder.Default
    @ManyToMany
    @JoinTable(name = "subgroup_students",
            joinColumns = @JoinColumn(name = "sub_group_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"sub_group_id", "student_id"}))
    private Set<Student> students = new HashSet<>();
}

