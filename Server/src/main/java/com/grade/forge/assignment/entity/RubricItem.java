package com.grade.forge.assignment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rubric_items")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class RubricItem {

    @Id
    private Long id;


}

