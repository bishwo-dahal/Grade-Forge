package com.grade.forge.student.service;

import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.student.dto.EnrollmentResponse;
import com.grade.forge.student.dto.FacultyStudentEmailSuggestionResponse;
import com.grade.forge.student.dto.FacultyStudentLookupResponse;
import com.grade.forge.student.entity.Enrollment;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.enums.EnrolledStatus;
import com.grade.forge.student.repository.EnrollmentRepository;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;

    // NOTE: Shared email format check keeps faculty lookup/enroll validation consistent.
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public EnrollmentResponse waitListCurrentStudentInCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return waitListStudentInCourse(student, courseId);
    }

    public EnrollmentResponse dropCurrentStudentFromCourse(String userEmail, Long courseId) {
        Student student = getStudentByUserEmail(userEmail);
        return dropStudentFromCourse(student, courseId);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCurrentStudentEnrollments(String userEmail) {
        Student student = getStudentByUserEmail(userEmail);
        return getEnrollmentsForStudent(student);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCourseEnrollments(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        return enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCourseEnrollmentsForFaculty(String facultyEmail, Long courseId) {
        Course course = getCourseOwnedByFaculty(facultyEmail, courseId);
        return enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EnrollmentResponse waitListStudentInCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        Enrollment existingEnrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElse(null);

        if (existingEnrollment == null) {
            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourse(course);
            enrollment.setEnrolledStatus(EnrolledStatus.WAITLIST);
            enrollment.setEnrolledAt(LocalDateTime.now());

            Enrollment saved = enrollmentRepository.save(enrollment);
            return mapToResponse(saved);
        }
        else{
            existingEnrollment.setEnrolledAt(LocalDateTime.now());
            existingEnrollment.setEnrolledStatus(EnrolledStatus.WAITLIST);
            Enrollment saved = enrollmentRepository.save(existingEnrollment);
            return mapToResponse(saved);
        }


    }

    private EnrollmentResponse dropStudentFromCourse(Student student, Long courseId) {
        Long studentId = student.getId();
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + studentId + " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.DROPPED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    public EnrollmentResponse enrollCurrentStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentById(studentId);
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + student.getId()+ " and course " + courseId));
        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }

    public EnrollmentResponse enrollCurrentStudentFromCourse(String facultyEmail, Long studentId, Long courseId) {
        // IMPORTANT: Faculty can only enroll students in courses they own.
        getCourseOwnedByFaculty(facultyEmail, courseId);
        return enrollCurrentStudentFromCourse(studentId, courseId);
    }

    public EnrollmentResponse dropStudentFromCourse(Long studentId, Long courseId) {
        Student student = getStudentById(studentId);
        return dropStudentFromCourse(student, courseId);
    }

    public EnrollmentResponse dropStudentFromCourse(String facultyEmail, Long studentId, Long courseId) {
        // IMPORTANT: Faculty can only drop students from courses they own.
        getCourseOwnedByFaculty(facultyEmail, courseId);
        return dropStudentFromCourse(studentId, courseId);
    }

    @Transactional(readOnly = true)
    public FacultyStudentLookupResponse searchStudentForFacultyCourse(String facultyEmail, Long courseId, String lookupEmail) {
        // IMPORTANT: Ownership is validated first so faculty cannot probe students in another faculty's course.
        Course course = getCourseOwnedByFaculty(facultyEmail, courseId);
        // NOTE: Search is intentionally lenient (no strict email-format rejection) so UI can return "not found" instead of HTTP 400.
        String normalizedEmail = normalizeLookupEmail(lookupEmail);

        Optional<Users> userOptional = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOptional.isEmpty()) {
            return FacultyStudentLookupResponse.builder()
                    .studentEmail(normalizedEmail)
                    .alreadyInCourse(false)
                    .currentStatus("NOT_FOUND")
                    .canEnroll(false)
                    .reason("No user exists with this email.")
                    .build();
        }

        Users user = userOptional.get();
        if (user.getRole() != Role.STUDENT) {
            return FacultyStudentLookupResponse.builder()
                    .studentEmail(user.getEmail())
                    .alreadyInCourse(false)
                    .currentStatus("NOT_STUDENT")
                    .canEnroll(false)
                    .reason("This email belongs to a non-student account.")
                    .build();
        }

        Student student = studentRepository.findByUser_EmailIgnoreCase(user.getEmail()).orElse(null);
        if (student == null) {
            return FacultyStudentLookupResponse.builder()
                    .studentName(user.getName())
                    .studentEmail(user.getEmail())
                    .alreadyInCourse(false)
                    .currentStatus("MISSING_PROFILE")
                    .canEnroll(false)
                    .reason("Student profile is missing. Ask admin to complete student setup.")
                    .build();
        }

        Enrollment existingEnrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId())
                .orElse(null);

        if (existingEnrollment == null) {
            return FacultyStudentLookupResponse.builder()
                    .studentId(student.getId())
                    .studentName(user.getName())
                    .studentEmail(user.getEmail())
                    .alreadyInCourse(false)
                    .currentStatus("NOT_ENROLLED")
                    .canEnroll(true)
                    .reason("Student can be enrolled in this course.")
                    .build();
        }

        boolean alreadyEnrolled = EnrolledStatus.ENROLLED.equals(existingEnrollment.getEnrolledStatus());
        return FacultyStudentLookupResponse.builder()
                .studentId(student.getId())
                .studentName(user.getName())
                .studentEmail(user.getEmail())
                .alreadyInCourse(alreadyEnrolled)
                .currentStatus(existingEnrollment.getEnrolledStatus().name())
                .canEnroll(!alreadyEnrolled)
                .reason(alreadyEnrolled
                        ? "Student is already enrolled in this course."
                        : "Student can be re-enrolled in this course.")
                .build();
    }

    @Transactional(readOnly = true)
    public List<FacultyStudentEmailSuggestionResponse> suggestStudentEmailsForFacultyCourse(String facultyEmail, Long courseId, String query) {
        // IMPORTANT: Even for suggestions we enforce faculty ownership to prevent cross-course data probing.
        Course course = getCourseOwnedByFaculty(facultyEmail, courseId);
        if (query == null) {
            return List.of();
        }
        String normalizedQuery = query.trim().toLowerCase();
        // NOTE: Suggestions update for every typed symbol to match expected web search behavior.
        if (normalizedQuery.isEmpty()) {
            return List.of();
        }

        // NOTE: Suggestions include both already-enrolled and not-yet-enrolled students so faculty can add new students quickly.
        Set<String> enrolledEmails = enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .filter(enrollment -> EnrolledStatus.ENROLLED.equals(enrollment.getEnrolledStatus()))
                .map(Enrollment::getStudent)
                .filter(student -> student != null && student.getUser() != null && student.getUser().getEmail() != null)
                .map(student -> student.getUser().getEmail().toLowerCase())
                .collect(Collectors.toSet());

        Map<String, String> emailByLowerCase = new LinkedHashMap<>();
        // NOTE: Prefer prefix matches first to keep suggestions predictable.
        userRepository.findTop8ByRoleAndEmailStartingWithIgnoreCase(Role.STUDENT, normalizedQuery).forEach(user ->
                putSuggestionEmail(emailByLowerCase, user == null ? null : user.getEmail()));
        studentRepository.findTop8ByUser_EmailStartingWithIgnoreCase(normalizedQuery).forEach(student ->
                putSuggestionEmail(emailByLowerCase, student != null && student.getUser() != null ? student.getUser().getEmail() : null));

        // NOTE: Fallback to contains search so suggestions still appear even when typing from the middle.
        userRepository.findTop8ByRoleAndEmailContainingIgnoreCase(Role.STUDENT, normalizedQuery).forEach(user ->
                putSuggestionEmail(emailByLowerCase, user == null ? null : user.getEmail()));
        studentRepository.findTop8ByUser_EmailContainingIgnoreCase(normalizedQuery).forEach(student ->
                putSuggestionEmail(emailByLowerCase, student != null && student.getUser() != null ? student.getUser().getEmail() : null));

        return emailByLowerCase.values().stream()
                .limit(8)
                .map(email -> FacultyStudentEmailSuggestionResponse.builder()
                        .email(email)
                        .alreadyInCourse(enrolledEmails.contains(email.toLowerCase()))
                        .build())
                .collect(Collectors.toList());
    }

    public EnrollmentResponse enrollStudentByEmailForFaculty(String facultyEmail, Long courseId, String studentEmail) {
        // IMPORTANT: Faculty can only enroll students in their own course.
        Course course = getCourseOwnedByFaculty(facultyEmail, courseId);
        String normalizedEmail = normalizeAndValidateEmail(studentEmail);

        Users user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
        if (user.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Only student accounts can be enrolled in a class");
        }

        Student student = studentRepository.findByUser_EmailIgnoreCase(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + user.getEmail()));

        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(student.getId(), course.getId())
                .orElseGet(() -> {
                    Enrollment newEnrollment = new Enrollment();
                    newEnrollment.setStudent(student);
                    newEnrollment.setCourse(course);
                    newEnrollment.setGrade(null);
                    return newEnrollment;
                });

        // FIX: Enroll-by-email is idempotent; existing ENROLLED rows stay ENROLLED, WAITLIST/DROPPED are promoted.
        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        enrollment.setEnrolledAt(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved);
    }


    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getCurrentStudentWaitlistedEnrollments(String userEmail) {
        Student student = getStudentByUserEmail(userEmail);
        return enrollmentRepository.findByStudent_Id(student.getId()).stream()
                .filter(enrollment -> EnrolledStatus.WAITLIST.equals(enrollment.getEnrolledStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    protected List<EnrollmentResponse> getEnrollmentsForStudent(Student student) {
        Long studentId = student.getId();
        return enrollmentRepository.findByStudent_Id(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Student getStudentByUserEmail(String email) {
        Users user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return studentRepository.findByUser_EmailIgnoreCase(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for user email: " + email));
    }

    private Course getCourseOwnedByFaculty(String facultyEmail, Long courseId) {
        Faculty faculty = facultyRepository.findByEmailIgnoreCase(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + facultyEmail));
        return courseRepository.findByIdAndFaculty_Id(courseId, faculty.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found for this faculty: " + courseId));
    }

    private String normalizeAndValidateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new IllegalArgumentException("Please provide a valid email address");
        }
        return normalizedEmail;
    }

    private String normalizeLookupEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase();
    }

    private void putSuggestionEmail(Map<String, String> emailByLowerCase, String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        String normalized = email.toLowerCase();
        emailByLowerCase.putIfAbsent(normalized, email);
    }

    private Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        Student student = enrollment.getStudent();
        String studentName = student != null && student.getUser() != null ? student.getUser().getName() : null;
        // NOTE: Include email so faculty student roster UI can use backend data without placeholders.
        String studentEmail = student != null && student.getUser() != null ? student.getUser().getEmail() : null;
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(student != null ? student.getId() : null)
                .studentName(studentName)
                .studentEmail(studentEmail)
                .courseId(enrollment.getCourse() != null ? enrollment.getCourse().getId() : null)
                .enrolledAt(enrollment.getEnrolledAt())
                .enrolledStatus(enrollment.getEnrolledStatus())
                .grade(enrollment.getGrade())
                .build();
    }
}
