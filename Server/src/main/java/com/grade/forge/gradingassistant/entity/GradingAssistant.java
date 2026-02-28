package com.grade.forge.gradingassistant.entity;

import com.grade.forge.user.entity.Users;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grading_assistant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GradingAssistant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Users user;

    @Column(nullable = false)
    private String officeHours;

    @Column(nullable = false)
    private String department;
}
