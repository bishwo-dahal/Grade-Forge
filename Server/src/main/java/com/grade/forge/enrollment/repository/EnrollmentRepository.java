package com.grade.forge.enrollment.repository;

import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    boolean existsByStudent_IdAndCourse_Id(Long studentId, Long courseId);
    Optional<Enrollment> findByStudent_IdAndCourse_Id(Long studentId, Long courseId);
    List<Enrollment> findByStudent_Id(Long studentId);
    List<Enrollment> findByCourse_Id(Long courseId);

    @Query("""
        SELECT e.course.id, COUNT(e)
        FROM Enrollment e
        WHERE e.course.id IN :courseIds AND e.enrolledStatus = :status
        GROUP BY e.course.id
        """)
    List<Object[]> countByCourseIdsAndStatus(@Param("courseIds") List<Long> courseIds, @Param("status") EnrolledStatus status);
}
