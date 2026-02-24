package com.grade.forge.coursemgmt.repository;

import com.grade.forge.coursemgmt.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByFaculty_Id(Long facultyId);
    Optional<Course> findByCourseCodeIgnoreCase(String courseCode);
    // NOTE: Faculty enrollment actions must verify the course belongs to the authenticated faculty.
    Optional<Course> findByIdAndFaculty_Id(Long courseId, Long facultyId);
}
