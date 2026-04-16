package com.grade.forge.submission.repository;

import com.grade.forge.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignment_Id(Long courseId);
    List<Submission> findByAssignment_IdAndStudent_Id(Long assignmentId, Long studentId);
    List<Submission> findByAssignment_IdAndStudent_IdIn(Long assignmentId, List<Long> studentIds);

    @Query("""
        SELECT s.assignment.course.id, COUNT(s)
        FROM Submission s
        WHERE s.assignment.course.id IN :courseIds AND s.marks IS NULL
        GROUP BY s.assignment.course.id
        """)
    List<Object[]> countPendingByCourseIds(@Param("courseIds") List<Long> courseIds);
}
