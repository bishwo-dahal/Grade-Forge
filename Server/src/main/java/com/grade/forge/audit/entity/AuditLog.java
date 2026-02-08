package com.grade.forge.audit.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "audit_logs")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class AuditLog {

    @Id
    private Long id;


}

