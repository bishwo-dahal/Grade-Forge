package com.grade.forge.group.repository;

import com.grade.forge.group.entity.SubGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubGroupRepository extends JpaRepository<SubGroup, Long> {
    boolean existsByMainGroup_IdAndNameIgnoreCase(Long mainGroupId, String name);
    List<SubGroup> findByMainGroup_Id(Long mainGroupId);
    Optional<SubGroup> findByIdAndMainGroup_Id(Long subGroupId, Long mainGroupId);
    boolean existsByMainGroup_IdAndStudents_Id(Long mainGroupId, Long studentId);
}


