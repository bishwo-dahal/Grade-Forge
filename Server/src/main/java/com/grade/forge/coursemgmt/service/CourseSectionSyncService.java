package com.grade.forge.coursemgmt.service;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.entity.AssignmentStarterFile;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.assignment.repository.AssignmentStarterFileRepository;
import com.grade.forge.assignment.service.AssignmentNotificationService;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.testsuite.entity.TestSuite;
import com.grade.forge.testsuite.repository.TestSuiteRepository;
import com.grade.forge.storage.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Synchronously mirrors parent-course assignments (and their test suites) onto linked section courses.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CourseSectionSyncService {

    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentStarterFileRepository assignmentStarterFileRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final FileStorageService fileStorageService;
    private final AssignmentNotificationService assignmentNotificationService;

    public void syncParentAssignmentCreateToSections(Assignment parentAssignment) {
        Course course = parentAssignment.getCourse();
        if (course.getParentCourse() != null) {
            return;
        }
        if (parentAssignment.getSourceAssignment() != null) {
            return;
        }
        List<Course> sections = courseRepository.findByParentCourse_Id(course.getId());
        if (sections.isEmpty()) {
            return;
        }
        for (Course section : sections) {
            upsertLinkedSectionAssignment(parentAssignment, section, true);
        }
    }

    public void syncParentAssignmentUpdateToSections(Assignment parentAssignment) {
        Course course = parentAssignment.getCourse();
        if (course.getParentCourse() != null) {
            return;
        }
        if (parentAssignment.getSourceAssignment() != null) {
            return;
        }
        List<Course> sections = courseRepository.findByParentCourse_Id(course.getId());
        if (sections.isEmpty()) {
            return;
        }
        for (Course section : sections) {
            upsertLinkedSectionAssignment(parentAssignment, section, false);
        }
    }

    public void syncParentTestSuiteToSections(Long parentAssignmentId) {
        Assignment parent = assignmentRepository.findById(parentAssignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + parentAssignmentId));
        Course course = parent.getCourse();
        if (course.getParentCourse() != null || parent.getSourceAssignment() != null) {
            return;
        }
        TestSuite parentSuite = testSuiteRepository.findByAssignment_Id(parentAssignmentId).orElse(null);
        if (parentSuite == null) {
            return;
        }
        List<Assignment> linkedChildren = assignmentRepository.findBySourceAssignment_IdAndInheritSyncEnabledIsTrue(parentAssignmentId);
        for (Assignment child : linkedChildren) {
            cloneOrReplaceTestSuite(parentSuite, child);
        }
    }

    /**
     * When a new section course is linked or created, copy every root assignment from the parent course.
     */
    public void backfillParentAssignmentsToSectionCourse(Course parentCourse, Course sectionCourse) {
        List<Assignment> parents = assignmentRepository.findByCourse_Id(parentCourse.getId());
        for (Assignment pa : parents) {
            if (pa.getSourceAssignment() != null) {
                continue;
            }
            upsertLinkedSectionAssignment(pa, sectionCourse, true);
        }
    }

    private void upsertLinkedSectionAssignment(Assignment parent, Course sectionCourse, boolean notifyOnCreate) {
        Optional<Assignment> existingOpt =
                assignmentRepository.findByCourse_IdAndSourceAssignment_Id(sectionCourse.getId(), parent.getId());
        boolean isNew = existingOpt.isEmpty();
        Assignment child = existingOpt.orElseGet(Assignment::new);

        if (isNew) {
            child.setCourse(sectionCourse);
            child.setSourceAssignment(parent);
            child.setInheritSyncEnabled(true);
        } else if (!Boolean.TRUE.equals(child.getInheritSyncEnabled())) {
            return;
        }

        applyParentMetadataToChild(parent, child, isNew);
        child.setMainGroup(null);
        child = assignmentRepository.save(child);

        replaceStarterFilesFromParent(parent, child);
        cloneTestSuiteFromParentIfAny(parent, child);

        child.setLastInheritedAt(LocalDateTime.now());
        assignmentRepository.save(child);

        if (isNew && notifyOnCreate) {
            try {
                assignmentNotificationService.notifyEnrolledNewAssignment(child);
            } catch (Exception e) {
                System.err.println("Failed to send section assignment notification emails: " + e.getMessage());
            }
        }
    }

    /**
     * @param copyTimeline when {@code true} (new section copy), copy availability/due dates from the parent.
     *        When {@code false} (parent was updated), leave the child's timeline unchanged so each section can set its own dates.
     */
    private void applyParentMetadataToChild(Assignment parent, Assignment child, boolean copyTimeline) {
        child.setName(parent.getName());
        child.setDescription(parent.getDescription());
        child.setTotalPoints(parent.getTotalPoints());
        child.setSubmissionType(parent.getSubmissionType());
        if (copyTimeline) {
            child.setAvailableFrom(parent.getAvailableFrom());
            child.setDueDate(parent.getDueDate());
            child.setLateDueDate(parent.getLateDueDate());
        }
        child.setProgrammingLanguage(parent.getProgrammingLanguage());
        child.setRubric(parent.getRubric());
    }

    private void replaceStarterFilesFromParent(Assignment parent, Assignment child) {
        List<AssignmentStarterFile> existingChild = assignmentStarterFileRepository.findByAssignment_Id(child.getId());
        if (!existingChild.isEmpty()) {
            fileStorageService.deleteObjects(existingChild.stream()
                    .map(AssignmentStarterFile::getFileKey)
                    .filter(k -> k != null && !k.isBlank())
                    .toList());
            assignmentStarterFileRepository.deleteAllInBatch(existingChild);
        }
        List<AssignmentStarterFile> parentFiles = assignmentStarterFileRepository.findByAssignment_Id(parent.getId());
        if (parentFiles.isEmpty()) {
            return;
        }
        List<AssignmentStarterFile> copied = fileStorageService.copyStarterFilesToAssignment(child, parentFiles);
        if (!copied.isEmpty()) {
            assignmentStarterFileRepository.saveAll(copied);
        }
    }

    private void cloneTestSuiteFromParentIfAny(Assignment parent, Assignment child) {
        Optional<TestSuite> parentSuiteOpt = testSuiteRepository.findByAssignment_Id(parent.getId());
        if (parentSuiteOpt.isEmpty()) {
            return;
        }
        cloneOrReplaceTestSuite(parentSuiteOpt.get(), child);
    }

    private void cloneOrReplaceTestSuite(TestSuite parentSuite, Assignment child) {
        List<TestCase> parentCases = parentSuite.getTestCases() == null ? List.of() : parentSuite.getTestCases();
        Optional<TestSuite> childSuiteOpt = testSuiteRepository.findByAssignment_Id(child.getId());
        TestSuite childSuite;
        if (childSuiteOpt.isEmpty()) {
            childSuite = new TestSuite();
            childSuite.setAssignment(child);
            childSuite.setTitle(parentSuite.getTitle() != null ? parentSuite.getTitle() : "Test Suite");
            childSuite.setDescription(parentSuite.getDescription());
            childSuite.setTestCases(new ArrayList<>());
        } else {
            childSuite = childSuiteOpt.get();
            childSuite.setTitle(parentSuite.getTitle() != null ? parentSuite.getTitle() : childSuite.getTitle());
            childSuite.setDescription(parentSuite.getDescription());
            childSuite.getTestCases().clear();
        }
        for (TestCase pc : parentCases) {
            TestCase tc = new TestCase();
            tc.setTestSuite(childSuite);
            tc.setTitle(pc.getTitle() != null ? pc.getTitle() : "");
            tc.setIsPrivate(Boolean.TRUE.equals(pc.getIsPrivate()));
            tc.setInput(pc.getInput());
            tc.setFileName(pc.getFileName());
            tc.setOutput(pc.getOutput() != null ? pc.getOutput() : "");
            childSuite.getTestCases().add(tc);
        }
        testSuiteRepository.save(childSuite);
    }
}
