package com.grade.forge.coursemgmt.repository;

import com.grade.forge.coursemgmt.entity.CourseImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseImageRepository extends JpaRepository<CourseImage, Long> {
    Optional<CourseImage> findByCourse_Id(Long courseId);
}
