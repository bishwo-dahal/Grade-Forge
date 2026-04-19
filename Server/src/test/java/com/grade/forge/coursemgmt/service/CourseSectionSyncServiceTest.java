package com.grade.forge.coursemgmt.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.assignment.repository.AssignmentStarterFileRepository;
import com.grade.forge.assignment.service.AssignmentNotificationService;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.semester.entity.Semester;
import com.grade.forge.storage.service.FileStorageService;
import com.grade.forge.testsuite.repository.TestSuiteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseSectionSyncServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private AssignmentRepository assignmentRepository;
    @Mock
    private AssignmentStarterFileRepository assignmentStarterFileRepository;
    @Mock
    private TestSuiteRepository testSuiteRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private AssignmentNotificationService assignmentNotificationService;

    @InjectMocks
    private CourseSectionSyncService courseSectionSyncService;

    @Test
    void syncParentAssignmentCreateToSections_createsChildWhenSectionExists() {
        Semester semester = new Semester();
        semester.setId(1L);
        semester.setName("Fall");
        semester.setStartDate(LocalDate.now());
        semester.setEndDate(LocalDate.now().plusMonths(4));

        Faculty faculty = new Faculty();
        faculty.setId(10L);
        faculty.setEmail("f@test.edu");

        Course main = new Course();
        main.setId(100L);
        main.setFaculty(faculty);
        main.setSemester(semester);
        main.setParentCourse(null);

        Course section = new Course();
        section.setId(200L);
        section.setFaculty(faculty);
        section.setSemester(semester);
        section.setParentCourse(main);

        ProgrammingLanguage lang = new ProgrammingLanguage();
        lang.setId(5L);
        lang.setName("Python");

        Assignment parent = new Assignment();
        parent.setId(50L);
        parent.setCourse(main);
        parent.setProgrammingLanguage(lang);
        parent.setName("Lab 1");
        parent.setDescription("desc");
        parent.setTotalPoints(10);
        parent.setSubmissionType(com.grade.forge.assignment.enums.SubmissionType.INDIVIDUAL);
        parent.setSourceAssignment(null);

        when(courseRepository.findByParentCourse_Id(100L)).thenReturn(List.of(section));
        when(assignmentRepository.findByCourse_IdAndSourceAssignment_Id(200L, 50L)).thenReturn(java.util.Optional.empty());
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(inv -> {
            Assignment a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(888L);
            }
            return a;
        });
        when(assignmentStarterFileRepository.findByAssignment_Id(nullable(Long.class))).thenReturn(List.of());
        when(testSuiteRepository.findByAssignment_Id(nullable(Long.class))).thenReturn(Optional.empty());

        courseSectionSyncService.syncParentAssignmentCreateToSections(parent);

        ArgumentCaptor<Assignment> captor = ArgumentCaptor.forClass(Assignment.class);
        verify(assignmentRepository, atLeastOnce()).save(captor.capture());
        Assignment saved = captor.getAllValues().getFirst();
        assertThat(saved.getCourse().getId()).isEqualTo(200L);
        assertThat(saved.getSourceAssignment().getId()).isEqualTo(50L);
        assertThat(saved.getMainGroup()).isNull();
        verify(assignmentNotificationService).notifyEnrolledNewAssignment(any(Assignment.class));
    }

    @Test
    void syncParentAssignmentCreateToSections_skipsWhenCourseIsSection() {
        Course parentOfMain = new Course();
        parentOfMain.setId(1L);

        Course main = new Course();
        main.setId(2L);
        main.setParentCourse(parentOfMain);

        Assignment parent = new Assignment();
        parent.setId(9L);
        parent.setCourse(main);

        courseSectionSyncService.syncParentAssignmentCreateToSections(parent);

        verify(courseRepository, never()).findByParentCourse_Id(any());
    }
}
