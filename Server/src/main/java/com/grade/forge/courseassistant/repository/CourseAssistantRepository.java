package com.grade.forge.courseassistant.repository;

import com.grade.forge.courseassistant.entity.CourseAssistant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseAssistantRepository extends JpaRepository<CourseAssistant, Long> {
    List<CourseAssistant> findAllByCourse_Faculty_Id(Long facultyId);
    List<CourseAssistant> findAllByCourse_IdAndCourse_Faculty_Id(Long courseId, Long facultyId);
    Optional<CourseAssistant> findByIdAndCourse_Faculty_Id(Long id, Long facultyId);
    boolean existsByGradingAssistant_IdAndCourse_Id(Long gradingAssistantId, Long courseId);
}

