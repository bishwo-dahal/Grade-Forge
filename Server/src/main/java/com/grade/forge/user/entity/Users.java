package com.grade.forge.user.entity;

import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.gradingassistant.entity.GradingAssistant;
import com.grade.forge.student.entity.Student;
import com.grade.forge.user.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToOne(mappedBy = "user")
    private Faculty faculty;

    @OneToOne(mappedBy = "user")
    private Student student;

    @OneToOne(mappedBy = "user")
    private GradingAssistant gradingAssistant;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserProfilePicture profilePicture;

    /**
     * JSONB user preferences (appearance, accessibility, etc).
     * Stored on Users so it applies to all roles (student/faculty/GA/admin).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> preferences = new HashMap<>();

}
