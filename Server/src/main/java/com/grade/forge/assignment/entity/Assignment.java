package com.grade.forge.assignment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assignments")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Assignment {

    @Id
    private Long id;


}

