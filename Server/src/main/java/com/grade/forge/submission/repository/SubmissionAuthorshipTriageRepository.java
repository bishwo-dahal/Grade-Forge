package com.grade.forge.submission.repository;

import com.grade.forge.submission.dto.AuthorshipTriageUniversityAdminItem;
import com.grade.forge.submission.entity.SubmissionAuthorshipTriage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubmissionAuthorshipTriageRepository extends JpaRepository<SubmissionAuthorshipTriage, Long> {

    Optional<SubmissionAuthorshipTriage> findBySubmission_IdAndFaculty_Id(Long submissionId, Long facultyId);

    List<SubmissionAuthorshipTriage> findBySubmission_Assignment_IdAndFaculty_Id(Long assignmentId, Long facultyId);

    @Query("""
            select new com.grade.forge.submission.dto.AuthorshipTriageUniversityAdminItem(
                s.id,
                st.id,
                coalesce(stu.name, ''),
                a.id,
                a.name,
                c.id,
                c.name,
                coalesce(c.courseCode, ''),
                f.id,
                f.name,
                f.email,
                t.label,
                t.labeledAt,
                t.notes
            )
            from SubmissionAuthorshipTriage t
            join t.submission s
            join s.student st
            left join st.user stu
            join s.assignment a
            join a.course c
            join c.faculty f
            order by t.labeledAt desc
            """)
    List<AuthorshipTriageUniversityAdminItem> findAllTrainingRowsForUniversityAdmin();
}
