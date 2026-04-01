package com.grade.forge.coursemgmt.repository;

import com.grade.forge.coursemgmt.entity.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    @EntityGraph(attributePaths = "courseImage")
    List<Course> findAll();

    @EntityGraph(attributePaths = "courseImage")
    List<Course> findByFaculty_Id(Long facultyId);

    @EntityGraph(attributePaths = "courseImage")
    List<Course> findByFaculty_IdAndSemester_Id(Long facultyId, Long semesterId);

    Optional<Course> findByCourseCodeIgnoreCase(String courseCode);

    List<Course> findByNameContainingIgnoreCaseOrCourseCodeContainingIgnoreCase(String nameKeyword, String codeKeyword);

    @EntityGraph(attributePaths = "courseImage")
    Optional<Course> findWithCourseImageById(Long id);
}
