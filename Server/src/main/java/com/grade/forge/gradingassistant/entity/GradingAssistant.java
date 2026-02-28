package com.grade.forge.gradingassistant.entity;

import com.grade.forge.user.entity.Users;
import jakarta.persistence.*;

@Entity
public class GradingAssistant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private Users user;
    private String officeHours;
    private String department;
}

