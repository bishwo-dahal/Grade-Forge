package com.grade.forge.classmgmt.repository;

import com.grade.forge.classmgmt.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

}

