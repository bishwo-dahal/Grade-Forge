package com.grade.forge.group.repository;

import com.grade.forge.group.entity.MainGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MainGroupRepository extends JpaRepository<MainGroup, Long> {
    boolean existsByCourse_IdAndNameIgnoreCase(Long courseId, String name);
    List<MainGroup> findByCourse_Id(Long courseId);
    Optional<MainGroup> findByIdAndCourse_Id(Long id, Long courseId);
}

