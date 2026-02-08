package com.grade.forge.assignment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "test_cases")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class TestCase {

    @Id
    private Long id;


}

