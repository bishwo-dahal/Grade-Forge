package com.grade.forge.submission.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "submissions")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Submission {

    @Id
    private Long id;


}

