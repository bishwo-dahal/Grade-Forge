package com.grade.forge.group.service;

import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.enrollment.repository.EnrollmentRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.group.dto.AddStudentToSubGroupRequest;
import com.grade.forge.group.dto.GroupStudentResponse;
import com.grade.forge.group.dto.MainGroupRequest;
import com.grade.forge.group.dto.MainGroupResponse;
import com.grade.forge.group.dto.SubGroupRequest;
import com.grade.forge.group.dto.SubGroupResponse;
import com.grade.forge.group.entity.MainGroup;
import com.grade.forge.group.entity.SubGroup;
import com.grade.forge.group.repository.MainGroupRepository;
import com.grade.forge.group.repository.SubGroupRepository;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupService {

    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final MainGroupRepository mainGroupRepository;
    private final SubGroupRepository subGroupRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public MainGroupResponse createMainGroup(String facultyEmail, Long courseId, MainGroupRequest request) {
        Course course = getCourseOwnedByFaculty(facultyEmail, courseId);
        String name = requireName(request.getName(), "Main group name is required");
        if (mainGroupRepository.existsByCourse_IdAndNameIgnoreCase(course.getId(), name)) {
            throw new IllegalArgumentException("A main group with this name already exists for the course");
        }
        MainGroup mainGroup = MainGroup.builder()
                .name(name)
                .course(course)
                .build();
        MainGroup saved = mainGroupRepository.save(mainGroup);
        return mapMainGroup(saved);
    }

    public SubGroupResponse createSubGroup(String facultyEmail, Long courseId, Long mainGroupId, SubGroupRequest request) {
        MainGroup mainGroup = getMainGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId);
        String name = requireName(request.getName(), "Sub group name is required");
        if (subGroupRepository.existsByMainGroup_IdAndNameIgnoreCase(mainGroup.getId(), name)) {
            throw new IllegalArgumentException("A sub group with this name already exists for the main group");
        }
        SubGroup subGroup = SubGroup.builder()
                .name(name)
                .mainGroup(mainGroup)
                .build();
        SubGroup saved = subGroupRepository.save(subGroup);
        return mapSubGroup(saved);
    }

    public MainGroupResponse updateMainGroup(String facultyEmail, Long courseId, Long mainGroupId, MainGroupRequest request) {
        MainGroup mainGroup = getMainGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId);
        String name = requireName(request.getName(), "Main group name is required");
        if (!mainGroup.getName().equalsIgnoreCase(name)
                && mainGroupRepository.existsByCourse_IdAndNameIgnoreCase(courseId, name)) {
            throw new IllegalArgumentException("A main group with this name already exists for the course");
        }
        mainGroup.setName(name);
        MainGroup saved = mainGroupRepository.save(mainGroup);
        return mapMainGroup(saved);
    }

    public SubGroupResponse updateSubGroup(String facultyEmail, Long courseId, Long mainGroupId, Long subGroupId, SubGroupRequest request) {
        SubGroup subGroup = getSubGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId, subGroupId);
        String name = requireName(request.getName(), "Sub group name is required");
        if (!subGroup.getName().equalsIgnoreCase(name)
                && subGroupRepository.existsByMainGroup_IdAndNameIgnoreCase(mainGroupId, name)) {
            throw new IllegalArgumentException("A sub group with this name already exists for the main group");
        }
        subGroup.setName(name);
        SubGroup saved = subGroupRepository.save(subGroup);
        return mapSubGroup(saved);
    }

    public SubGroupResponse addStudentToSubGroup(String facultyEmail, Long courseId, Long mainGroupId, Long subGroupId, AddStudentToSubGroupRequest request) {
        SubGroup subGroup = getSubGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId, subGroupId);
        Long studentId = Objects.requireNonNull(request.getStudentId(), "studentId is required");
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        if (!enrollmentRepository.existsByStudent_IdAndCourse_Id(student.getId(), courseId)) {
            throw new IllegalArgumentException("Student is not enrolled in this course");
        }
        if (subGroupRepository.existsByMainGroup_IdAndStudents_Id(mainGroupId, student.getId())) {
            throw new IllegalArgumentException("Student is already assigned to another sub group in this main group");
        }
        boolean added = subGroup.getStudents().add(student);
        if (!added) {
            throw new IllegalArgumentException("Student is already part of this sub group");
        }
        SubGroup saved = subGroupRepository.save(subGroup);
        return mapSubGroup(saved);
    }

    public SubGroupResponse removeStudentFromSubGroup(String facultyEmail, Long courseId, Long mainGroupId, Long subGroupId, Long studentId) {
        SubGroup subGroup = getSubGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId, subGroupId);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        boolean removed = subGroup.getStudents().removeIf(s -> Objects.equals(s.getId(), student.getId()));
        if (!removed) {
            throw new IllegalArgumentException("Student is not part of this sub group");
        }
        SubGroup saved = subGroupRepository.save(subGroup);
        return mapSubGroup(saved);
    }

    public void deleteMainGroup(String facultyEmail, Long courseId, Long mainGroupId) {
        MainGroup mainGroup = getMainGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId);
        mainGroupRepository.delete(mainGroup);
    }

    public void deleteSubGroup(String facultyEmail, Long courseId, Long mainGroupId, Long subGroupId) {
        SubGroup subGroup = getSubGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId, subGroupId);
        subGroupRepository.delete(subGroup);
    }

    @Transactional(readOnly = true)
    public List<MainGroupResponse> listCourseGroupsForFaculty(String facultyEmail, Long courseId) {
        getCourseOwnedByFaculty(facultyEmail, courseId);
        List<MainGroup> groups = mainGroupRepository.findByCourse_Id(courseId);
        return groups.stream().map(this::mapMainGroup).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MainGroupResponse> listCourseGroupsForStudent(String studentEmail, Long courseId) {
        Student student = getStudentByEmail(studentEmail);
        if (!enrollmentRepository.existsByStudent_IdAndCourse_Id(student.getId(), courseId)) {
            throw new IllegalArgumentException("You are not enrolled in this course");
        }
        List<MainGroup> groups = mainGroupRepository.findByCourse_Id(courseId);
        return groups.stream().map(this::mapMainGroup).collect(Collectors.toList());
    }

    private Course getCourseOwnedByFaculty(String facultyEmail, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        Faculty faculty = course.getFaculty();
        if (faculty == null || faculty.getEmail() == null || !faculty.getEmail().equalsIgnoreCase(facultyEmail)) {
            throw new IllegalArgumentException("You are not allowed to manage groups for this course");
        }
        return course;
    }

    private MainGroup getMainGroupForCourseAndFaculty(String facultyEmail, Long courseId, Long mainGroupId) {
        getCourseOwnedByFaculty(facultyEmail, courseId);
        return mainGroupRepository.findByIdAndCourse_Id(mainGroupId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Main group not found for course"));
    }

    private SubGroup getSubGroupForCourseAndFaculty(String facultyEmail, Long courseId, Long mainGroupId, Long subGroupId) {
        MainGroup mainGroup = getMainGroupForCourseAndFaculty(facultyEmail, courseId, mainGroupId);
        return subGroupRepository.findByIdAndMainGroup_Id(subGroupId, mainGroup.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sub group not found for main group"));
    }

    private Student getStudentByEmail(String email) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + email));
    }

    private String requireName(String name, String message) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return name.trim();
    }

    private MainGroupResponse mapMainGroup(MainGroup mainGroup) {
        List<SubGroupResponse> subGroups = (mainGroup.getSubGroups() == null ? List.<SubGroupResponse>of() : mainGroup.getSubGroups().stream()
                .map(this::mapSubGroup)
                .collect(Collectors.toList()));
        return MainGroupResponse.builder()
                .id(mainGroup.getId())
                .name(mainGroup.getName())
                .subGroups(subGroups)
                .build();
    }

    private SubGroupResponse mapSubGroup(SubGroup subGroup) {
        List<GroupStudentResponse> members = (subGroup.getStudents() == null ? List.<GroupStudentResponse>of() : subGroup.getStudents().stream()
                .map(student -> GroupStudentResponse.builder()
                        .id(student.getId())
                        .name(student.getUser() != null ? student.getUser().getName() : null)
                        .email(student.getUser() != null ? student.getUser().getEmail() : null)
                        .cwid(student.getCwid())
                        .build())
                .collect(Collectors.toList()));
        return SubGroupResponse.builder()
                .id(subGroup.getId())
                .name(subGroup.getName())
                .students(members)
                .build();
    }
}






