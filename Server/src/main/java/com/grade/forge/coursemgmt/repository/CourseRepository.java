package com.grade.forge.coursemgmt.repository;

import com.grade.forge.coursemgmt.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByFaculty_Id(Long facultyId);
}
