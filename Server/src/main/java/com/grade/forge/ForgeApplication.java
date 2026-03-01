package com.grade.forge;

import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.enums.SubmissionType;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.coursemgmt.entity.Course;
import com.grade.forge.coursemgmt.repository.CourseRepository;
import com.grade.forge.faculty.dto.FacultyCreateRequest;
import com.grade.forge.faculty.entity.Faculty;
import com.grade.forge.faculty.repository.FacultyRepository;
import com.grade.forge.faculty.service.FacultyService;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.programminglanguage.repository.ProgrammingLanguageRepository;
import com.grade.forge.semester.entity.Semester;
import com.grade.forge.semester.repository.SemesterRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@SpringBootApplication
public class ForgeApplication {

    @Autowired
    private FacultyService facultyService;
    @Autowired
    private SemesterRepository semesterRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private ProgrammingLanguageRepository programmingLanguageRepository;
    @Autowired
    private AssignmentRepository assignmentRepository;
    @Autowired
    private FacultyRepository facultyRepository;

    public static void main(String[] args) {
        SpringApplication.run(ForgeApplication.class, args);

    }

    @Bean
    CommandLineRunner seedUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        FacultyCreateRequest facultyCreateRequest = new FacultyCreateRequest(
                "Dr. John Smith",
                "faculty@gmail.com",
                "Computer Science",
                "PhD in Computer Science",
                "+1-555-123-4567",
                "4pm - 6pm",
                "Room 305, Science Building",
                "faculty"
        );

        if(userRepository.findByEmail(facultyCreateRequest.getEmail()).isEmpty()){
            facultyService.createFaculty(facultyCreateRequest);
        }



        return args -> {

            createIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "System Admin",
                    "system@gmail.com",
                    "admin123",
                    Role.SYSTEM_ADMIN
            );

            createIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "University Testing",
                    "university@gmail.com",
                    "university",
                    Role.UNIVERSITY_ADMIN
            );

            createIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "Student Test",
                    "student@gmail.com",
                    "student",
                    Role.STUDENT
            );

            seedAcademicData();
        };
    }

    private void createIfNotExists(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String name,
            String email,
            String rawPassword,
            Role role
    ) {
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        Users user = new Users();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        userRepository.save(user);

        System.out.println("✅ Created " + role + " → " + email);
    }

    private void seedAcademicData() {
        Semester semester = semesterRepository.findByNameIgnoreCase("Semester 2")
                .orElseGet(() -> {
                    Semester s = new Semester();
                    s.setName("Semester 2");
                    s.setStartDate(LocalDate.now().withDayOfMonth(1));
                    s.setEndDate(LocalDate.now().plusMonths(4));
                    return semesterRepository.save(s);
                });

        ProgrammingLanguage java = programmingLanguageRepository.findByNameIgnoreCase("Java")
                .orElseGet(() -> {
                    ProgrammingLanguage lang = new ProgrammingLanguage();
                    lang.setName("Java");
                    lang.setDockerImage("openjdk:17");
                    lang.setExecutionCode("javac Main.java && java Main");
                    lang.setIsActive(true);
                    return programmingLanguageRepository.save(lang);
                });

        Faculty faculty = facultyRepository.findByEmail("faculty@gmail.com")
                .orElseThrow(() -> new IllegalStateException("Seed faculty not found"));

        Course course = courseRepository.findByCourseCodeIgnoreCase("CS-102")
                .orElseGet(() -> {
                    Course c = new Course();
                    c.setName("Data Structures");
                    c.setCourseCode("CS-102");
                    c.setSection("A");
                    c.setDescription("Seed course for Semester 2");
                    c.setSemester(semester);
                    c.setFaculty(faculty);
                    return courseRepository.save(c);
                });

        assignmentRepository.findByCourse_IdAndNameIgnoreCase(course.getId(), "Project 1")
                .orElseGet(() -> {
                    Assignment a = new Assignment();
                    a.setCourse(course);
                    a.setProgrammingLanguage(java);
                    a.setName("Project 1");
                    a.setDescription("Seed assignment for course CS-102");
                    a.setTotalPoints(100);
                    a.setSubmissionType(SubmissionType.INDIVIDUAL);
                    a.setAvailableFrom(LocalDateTime.now().minusDays(1));
                    a.setDueDate(LocalDateTime.now().plusDays(7));
                    a.setLateDueDate(LocalDateTime.now().plusDays(10));
                    return assignmentRepository.save(a);
                });
    }

}
