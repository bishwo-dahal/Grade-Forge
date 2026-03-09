package com.grade.forge.seed;

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
import com.grade.forge.rubric.entity.Rubric;
import com.grade.forge.rubric.entity.RubricCriteria;
import com.grade.forge.rubric.repository.RubricRepository;
import com.grade.forge.semester.entity.Semester;
import com.grade.forge.semester.repository.SemesterRepository;
import com.grade.forge.student.entity.Student;
import com.grade.forge.student.repository.StudentRepository;
import com.grade.forge.enrollment.entity.Enrollment;
import com.grade.forge.enrollment.enums.EnrolledStatus;
import com.grade.forge.testsuite.entity.TestCase;
import com.grade.forge.testsuite.entity.TestSuite;
import com.grade.forge.testsuite.repository.TestSuiteRepository;
import com.grade.forge.user.entity.Users;
import com.grade.forge.user.enums.Role;
import com.grade.forge.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds the database with faculties, students, university admins, semesters, courses, and assignments.
 * Only runs when {@code app.seed.enabled=true} (e.g. {@code mvn spring-boot:run -Dapp.seed.enabled=true}).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FacultyService facultyService;
    private final FacultyRepository facultyRepository;
    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;
    private final ProgrammingLanguageRepository programmingLanguageRepository;
    private final AssignmentRepository assignmentRepository;
    private final RubricRepository rubricRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final StudentRepository studentRepository;

    @Value("${app.seed.reset:false}")
    private boolean resetDatabase;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Database seed enabled (app.seed.enabled=true). Running seed...");
        if (resetDatabase) {
            log.warn("app.seed.reset=true → truncating core teaching tables before seeding.");
            truncateCoreTables();
        }
        seedFaculties();
        seedUsers();
        seedAcademicData();
        log.info("Database seed completed.");
    }

    @Transactional
    private void truncateCoreTables() {
        // Order does not matter with CASCADE, but we keep a logical grouping for readability.
        entityManager.createNativeQuery(
                        "TRUNCATE TABLE " +
                                "submission_grades, submission_files, submissions, " +
                                "test_cases, test_suites, " +
                                "enrollment, " +
                                "assignments, courses, " +
                                "rubric_criteria, rubrics, " +
                                "student, " +
                                "semesters, " +
                                "users, " +
                                "programming_language " +
                                "RESTART IDENTITY CASCADE")
                .executeUpdate();
    }

    private void seedFaculties() {
        if (userRepository.findByEmail("faculty@gmail.com").isEmpty()) {
            facultyService.createFaculty(new FacultyCreateRequest(
                    "Dr. John Smith",
                    "faculty@gmail.com",
                    "Computer Science",
                    "PhD in Computer Science",
                    "+1-555-123-4567",
                    "4pm - 6pm",
                    "Room 305, Science Building",
                    "faculty"
            ));
        }
        if (userRepository.findByEmail("faculty1@gmail.com").isEmpty()) {
            facultyService.createFaculty(new FacultyCreateRequest(
                    "Dr. Jane Doe",
                    "faculty1@gmail.com",
                    "Computer Science",
                    "PhD in Software Engineering",
                    "+1-555-987-6543",
                    "10am - 12pm",
                    "Room 210, Engineering Building",
                    "faculty"
            ));
        }
    }

    private void seedUsers() {
        createUserIfNotExists("University Admin", "university@gmail.com", "university", Role.UNIVERSITY_ADMIN);
        createUserIfNotExists("University Admin Two", "university1@gmail.com", "university", Role.UNIVERSITY_ADMIN);
        createUserIfNotExists("Student One", "student@gmail.com", "student", Role.STUDENT);
        createUserIfNotExists("Student Two", "student1@gmail.com", "student", Role.STUDENT);
        createUserIfNotExists("Student Three", "student2@gmail.com", "student", Role.STUDENT);
    }

    private void createUserIfNotExists(String name, String email, String rawPassword, Role role) {
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }
        Users user = new Users();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        userRepository.save(user);
        log.info("Created {} → {}", role, email);
    }

    private void seedAcademicData() {
        semesterRepository.findByNameIgnoreCase("Semester 1")
                .orElseGet(() -> {
                    Semester s = new Semester();
                    s.setName("Semester 1");
                    s.setStartDate(LocalDate.now().minusMonths(4));
                    s.setEndDate(LocalDate.now().minusDays(1));
                    return semesterRepository.save(s);
                });

        Semester semester2 = semesterRepository.findByNameIgnoreCase("Semester 2")
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
                    lang.setDockerImage("eclipse-temurin:17-jdk");
                    lang.setCompileCommand("javac {{main_file}}");
                    lang.setExecutionCode("java {{main_class}}");
                    lang.setAllowedExtensions(".java,.txt,.csv");
                    lang.setIsActive(true);
                    return programmingLanguageRepository.save(lang);
                });

        ProgrammingLanguage python = programmingLanguageRepository.findByNameIgnoreCase("Python")
                .orElseGet(() -> {
                    ProgrammingLanguage lang = new ProgrammingLanguage();
                    lang.setName("Python");
                    lang.setDockerImage("python:3.11-slim");
                    lang.setCompileCommand(null);
                    lang.setExecutionCode("python3 {{main_file}}");
                    lang.setAllowedExtensions(".py,.txt,.csv");
                    lang.setIsActive(true);
                    return programmingLanguageRepository.save(lang);
                });

        Faculty primaryFaculty = facultyRepository.findByEmail("faculty@gmail.com")
                .orElseThrow(() -> new IllegalStateException("Seed faculty not found: faculty@gmail.com"));
        Faculty secondaryFaculty = facultyRepository.findByEmail("faculty1@gmail.com")
                .orElse(primaryFaculty);

        Course cs102 = courseRepository.findByCourseCodeIgnoreCase("CS-102")
                .orElseGet(() -> {
                    Course c = new Course();
                    c.setName("Data Structures");
                    c.setCourseCode("CS-102");
                    c.setSection("A");
                    c.setDescription("Seed course for Java programming assignments.");
                    c.setSemester(semester2);
                    c.setFaculty(primaryFaculty);
                    return courseRepository.save(c);
                });

        Course cs101 = courseRepository.findByCourseCodeIgnoreCase("CS-101")
                .orElseGet(() -> {
                    Course c = new Course();
                    c.setName("Intro to Programming");
                    c.setCourseCode("CS-101");
                    c.setSection("B");
                    c.setDescription("Seed course for Python programming assignments.");
                    c.setSemester(semester2);
                    c.setFaculty(secondaryFaculty);
                    return courseRepository.save(c);
                });

        // Ensure the \"first\" course is owned by the first faculty for clearer seeded examples.
        if (!cs101.getFaculty().getId().equals(primaryFaculty.getId())) {
            cs101.setFaculty(primaryFaculty);
            courseRepository.save(cs101);
        }

        LocalDateTime availableFrom = LocalDateTime.now().minusDays(1);
        LocalDateTime dueDate = LocalDateTime.now().plusDays(15);
        LocalDateTime lateDueDate = LocalDateTime.now().plusDays(20);

        Assignment fabricAssignment = assignmentRepository
                .findByCourse_IdAndNameIgnoreCase(cs102.getId(), "Project 1 - Fabric Class")
                .orElseGet(() -> {
                    Assignment a = new Assignment();
                    a.setCourse(cs102);
                    a.setProgrammingLanguage(java);
                    a.setName("Project 1 - Fabric Class");
                    a.setDescription("Implement a Fabric class and FabricTester, including constructors, getters/setters, "
                            + "price calculations, and formatted toString, as described in the seed_database.md.");
                    a.setTotalPoints(100);
                    a.setSubmissionType(SubmissionType.INDIVIDUAL);
                    a.setAvailableFrom(availableFrom);
                    a.setDueDate(dueDate);
                    a.setLateDueDate(lateDueDate);
                    return assignmentRepository.save(a);
                });

        Assignment jukeboxAssignment = assignmentRepository
                .findByCourse_IdAndNameIgnoreCase(cs101.getId(), "Assignment 1 - Digital Jukebox")
                .orElseGet(() -> {
                    Assignment a = new Assignment();
                    a.setCourse(cs101);
                    a.setProgrammingLanguage(python);
                    a.setName("Assignment 1 - Digital Jukebox");
                    a.setDescription("Read keyboard input for song, artist, and repeat count; compute subtotal, tax, and total "
                            + "for a jukebox purchase, and display a formatted receipt.");
                    a.setTotalPoints(50);
                    a.setSubmissionType(SubmissionType.INDIVIDUAL);
                    a.setAvailableFrom(availableFrom);
                    a.setDueDate(dueDate);
                    a.setLateDueDate(lateDueDate);
                    return assignmentRepository.save(a);
                });

        Assignment initialsAssignment = assignmentRepository
                .findByCourse_IdAndNameIgnoreCase(cs101.getId(), "Assignment 2 - Initials Generator")
                .orElseGet(() -> {
                    Assignment a = new Assignment();
                    a.setCourse(cs101);
                    a.setProgrammingLanguage(python);
                    a.setName("Assignment 2 - Initials Generator");
                    a.setDescription("Ask for first and last name, present options, and generate initials using Python's format "
                            + "function and decision structures.");
                    a.setTotalPoints(50);
                    a.setSubmissionType(SubmissionType.INDIVIDUAL);
                    a.setAvailableFrom(availableFrom);
                    a.setDueDate(dueDate);
                    a.setLateDueDate(lateDueDate);
                    return assignmentRepository.save(a);
                });

        // Additional Python assignments from seed_database.md (word length and random prices).
        Assignment wordLengthAssignment = assignmentRepository
                .findByCourse_IdAndNameIgnoreCase(cs101.getId(), "Assignment 3 - Word Length Counter")
                .orElseGet(() -> {
                    Assignment a = new Assignment();
                    a.setCourse(cs101);
                    a.setProgrammingLanguage(python);
                    a.setName("Assignment 3 - Word Length Counter");
                    a.setDescription("Write a program that repeatedly asks the user for words, validates input so words "
                            + "contain only letters, counts how many words have 5 to 10 letters, and finally displays "
                            + "the count and the list of matching words, or 'No words found'.");
                    a.setTotalPoints(10);
                    a.setSubmissionType(SubmissionType.INDIVIDUAL);
                    a.setAvailableFrom(availableFrom);
                    a.setDueDate(dueDate);
                    a.setLateDueDate(lateDueDate);
                    return assignmentRepository.save(a);
                });

        Assignment pricesAssignment = assignmentRepository
                .findByCourse_IdAndNameIgnoreCase(cs101.getId(), "Assignment 4 - Price Range Analyzer")
                .orElseGet(() -> {
                    Assignment a = new Assignment();
                    a.setCourse(cs101);
                    a.setProgrammingLanguage(python);
                    a.setName("Assignment 4 - Price Range Analyzer");
                    a.setDescription("Read a text file of random prices, compute the sum of all prices, and count how many "
                            + "prices fall into the ranges 0.00–9.99, 10.00–19.99, 20.00–29.99, 30.00–39.99, and 40.00–49.99.");
                    a.setTotalPoints(10);
                    a.setSubmissionType(SubmissionType.INDIVIDUAL);
                    a.setAvailableFrom(availableFrom);
                    a.setDueDate(dueDate);
                    a.setLateDueDate(lateDueDate);
                    return assignmentRepository.save(a);
                });

        // Ensure sample students exist and enroll them into courses.
        Student studentOne = getOrCreateStudentForUser("student@gmail.com", "S1001");
        Student studentTwo = getOrCreateStudentForUser("student1@gmail.com", "S1002");
        Student studentThree = getOrCreateStudentForUser("student2@gmail.com", "S1003");

        enrollIfNotExists(studentOne, cs101);
        enrollIfNotExists(studentTwo, cs101);
        enrollIfNotExists(studentThree, cs101);
        enrollIfNotExists(studentOne, cs102);

        seedRubrics(primaryFaculty, fabricAssignment, jukeboxAssignment, initialsAssignment);
        seedAdditionalRubrics(primaryFaculty, wordLengthAssignment, pricesAssignment, fabricAssignment);
        seedTestSuites(jukeboxAssignment, initialsAssignment, wordLengthAssignment, pricesAssignment, fabricAssignment);
    }

    private void seedRubrics(
            Faculty primaryFaculty,
            Assignment fabricAssignment,
            Assignment jukeboxAssignment,
            Assignment initialsAssignment
    ) {
        // Rubric for Digital Jukebox (taken from seed_database.md grading section).
        Rubric jukeboxRubric = rubricRepository.findByFaculty_Id(primaryFaculty.getId())
                .stream()
                .filter(r -> "Digital Jukebox Grading Rubric".equals(r.getName()))
                .findFirst()
                .orElseGet(() -> createDigitalJukeboxRubric(primaryFaculty));

        // Optional rubric for Initials Generator (also based on seed_database.md).
        Rubric initialsRubric = rubricRepository.findByFaculty_Id(primaryFaculty.getId())
                .stream()
                .filter(r -> "Initials Generator Grading Rubric".equals(r.getName()))
                .findFirst()
                .orElseGet(() -> createInitialsGeneratorRubric(primaryFaculty));

        // Attach rubric to Digital Jukebox assignment (with rubric).
        if (jukeboxAssignment.getRubric() == null) {
            jukeboxAssignment.setRubric(jukeboxRubric);
            assignmentRepository.save(jukeboxAssignment);
        }

        // Intentionally leave Fabric assignment without a rubric to have assignments without rubrics.
        // Attach rubric to Initials assignment as another rubric-backed example.
        if (initialsAssignment.getRubric() == null) {
            initialsAssignment.setRubric(initialsRubric);
            assignmentRepository.save(initialsAssignment);
        }
    }

    private Student getOrCreateStudentForUser(String email, String cwid) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Seed user not found for student: " + email));

        return studentRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Student student = new Student();
                    student.setUser(user);
                    student.setCwid(cwid);
                    student.setMajor("Computer Science");
                    student.setCanvasUserId(null);
                    return studentRepository.save(student);
                });
    }

    private void enrollIfNotExists(Student student, Course course) {
        boolean exists = course.getEnrollments()
                .stream()
                .anyMatch(e -> e.getStudent().getId().equals(student.getId()));
        if (exists) {
            return;
        }
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledStatus(EnrolledStatus.ENROLLED);
        enrollment.setGrade(null);

        course.getEnrollments().add(enrollment);
        courseRepository.save(course);
    }

    private Rubric createDigitalJukeboxRubric(Faculty faculty) {
        Rubric rubric = new Rubric();
        rubric.setFaculty(faculty);
        rubric.setName("Digital Jukebox Grading Rubric");
        rubric.setDescription("Rubric based on the Digital Jukebox assignment in seed_database.md.");

        List<RubricCriteria> criteriaList = new ArrayList<>();

        criteriaList.add(buildCriteria(rubric,
                "Get song name correctly.",
                "Student correctly reads the song name from input.",
                2));
        criteriaList.add(buildCriteria(rubric,
                "Get artist correctly.",
                "Student correctly reads the artist from input.",
                2));
        criteriaList.add(buildCriteria(rubric,
                "Get number of plays correctly.",
                "Student correctly reads how many times the song should be played.",
                2));
        criteriaList.add(buildCriteria(rubric,
                "Calculate subtotal, tax, and total correctly.",
                "Subtotal, 11% tax, and total are calculated correctly.",
                2));
        criteriaList.add(buildCriteria(rubric,
                "Display choice information correctly.",
                "Displays the song, artist, and repeat count clearly.",
                1));
        criteriaList.add(buildCriteria(rubric,
                "Display receipt correctly.",
                "Displays final receipt in a readable and correct format.",
                1));

        rubric.setCriteria(criteriaList);
        return rubricRepository.save(rubric);
    }

    private Rubric createInitialsGeneratorRubric(Faculty faculty) {
        Rubric rubric = new Rubric();
        rubric.setFaculty(faculty);
        rubric.setName("Initials Generator Grading Rubric");
        rubric.setDescription("Rubric based on the Initials Generator assignment in seed_database.md.");

        List<RubricCriteria> criteriaList = new ArrayList<>();

        criteriaList.add(buildCriteria(rubric,
                "Get first and last name from user with 1 input statement.",
                "Single input statement correctly captures first and last name.",
                3));
        criteriaList.add(buildCriteria(rubric,
                "Display the 3 options.",
                "Displays all three options for generating initials.",
                1));
        criteriaList.add(buildCriteria(rubric,
                "Get user’s choice.",
                "Correctly reads and validates the user’s menu choice.",
                1));
        criteriaList.add(buildCriteria(rubric,
                "Create the correct initial or initials.",
                "Generates initials that match the chosen option.",
                3));
        criteriaList.add(buildCriteria(rubric,
                "Display the initial or initials as shown in sample execution.",
                "Output formatting matches the example.",
                2));
        criteriaList.add(buildCriteria(rubric,
                "Uses format correctly when displaying the initial or initials.",
                "Uses Python's format (or equivalent) correctly.",
                2));

        rubric.setCriteria(criteriaList);
        return rubricRepository.save(rubric);
    }

    private RubricCriteria buildCriteria(Rubric rubric, String title, String description, int maxScore) {
        RubricCriteria criteria = new RubricCriteria();
        criteria.setRubric(rubric);
        criteria.setTitle(title);
        criteria.setDescription(description);
        criteria.setMaxScore(maxScore);
        criteria.setWeight(null);
        return criteria;
    }

    private void seedAdditionalRubrics(
            Faculty primaryFaculty,
            Assignment wordLengthAssignment,
            Assignment pricesAssignment,
            Assignment fabricAssignment
    ) {
        // Word Length assignment rubric (while loops + decision structures).
        Rubric wordLengthRubric = rubricRepository.findByFaculty_Id(primaryFaculty.getId())
                .stream()
                .filter(r -> "Word Length Counter Grading Rubric".equals(r.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Rubric rubric = new Rubric();
                    rubric.setFaculty(primaryFaculty);
                    rubric.setName("Word Length Counter Grading Rubric");
                    rubric.setDescription("Rubric based on the while-loops 'word length' assignment in seed_database.md.");

                    List<RubricCriteria> criteriaList = new ArrayList<>();
                    criteriaList.add(buildCriteria(rubric,
                            "User can enter as many words as they need.",
                            "Loop continues until the user chooses to stop entering words.",
                            1));
                    criteriaList.add(buildCriteria(rubric,
                            "Input validation for letters only.",
                            "Rejects words with non-letter characters and re-prompts until valid.",
                            2));
                    criteriaList.add(buildCriteria(rubric,
                            "Determine if the word has 5 to 10 letters.",
                            "Correctly identifies words whose length is between 5 and 10 inclusive.",
                            2));
                    criteriaList.add(buildCriteria(rubric,
                            "Counts and stores words with 5 to 10 letters.",
                            "Accurately counts and stores all qualifying words.",
                            3));
                    criteriaList.add(buildCriteria(rubric,
                            "Display of results.",
                            "Displays either the count and list of words or 'No words found'.",
                            2));

                    rubric.setCriteria(criteriaList);
                    return rubricRepository.save(rubric);
                });

        if (wordLengthAssignment.getRubric() == null) {
            wordLengthAssignment.setRubric(wordLengthRubric);
            assignmentRepository.save(wordLengthAssignment);
        }

        // Random prices file assignment rubric.
        Rubric pricesRubric = rubricRepository.findByFaculty_Id(primaryFaculty.getId())
                .stream()
                .filter(r -> "Price Range Analyzer Grading Rubric".equals(r.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Rubric rubric = new Rubric();
                    rubric.setFaculty(primaryFaculty);
                    rubric.setName("Price Range Analyzer Grading Rubric");
                    rubric.setDescription("Rubric based on the random prices file assignment in seed_database.md.");

                    List<RubricCriteria> criteriaList = new ArrayList<>();
                    criteriaList.add(buildCriteria(rubric,
                            "Open file correctly.",
                            "Program opens the input price file correctly.",
                            1));
                    criteriaList.add(buildCriteria(rubric,
                            "Read entire file correctly.",
                            "Reads all prices from the file without skipping or duplicating lines.",
                            1));
                    criteriaList.add(buildCriteria(rubric,
                            "Determine range price is in correctly.",
                            "Each price is classified into the correct range bucket.",
                            2));
                    criteriaList.add(buildCriteria(rubric,
                            "Find sum of prices correctly.",
                            "Computes the total sum of all prices accurately.",
                            4));
                    criteriaList.add(buildCriteria(rubric,
                            "Close file correctly.",
                            "Closes the file / releases resources appropriately.",
                            2));

                    rubric.setCriteria(criteriaList);
                    return rubricRepository.save(rubric);
                });

        if (pricesAssignment.getRubric() == null) {
            pricesAssignment.setRubric(pricesRubric);
            assignmentRepository.save(pricesAssignment);
        }

        // Fabric assignment rubric (not attached to assignment to preserve a no-rubric example).
        rubricRepository.findByFaculty_Id(primaryFaculty.getId())
                .stream()
                .filter(r -> "Fabric Project Grading Rubric".equals(r.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Rubric rubric = new Rubric();
                    rubric.setFaculty(primaryFaculty);
                    rubric.setName("Fabric Project Grading Rubric");
                    rubric.setDescription("Rubric based on the Fabric class and FabricTester assignment in seed_database.md.");

                    List<RubricCriteria> criteriaList = new ArrayList<>();
                    criteriaList.add(buildCriteria(rubric,
                            "Fabric class instance variables.",
                            "Correct set of instance variables without extras.",
                            3));
                    criteriaList.add(buildCriteria(rubric,
                            "Constructors, getters, and setters.",
                            "All constructors and accessors/mutators implemented correctly.",
                            6));
                    criteriaList.add(buildCriteria(rubric,
                            "Calculation methods.",
                            "calcTotalPrice, calcMeters, calcSqFeet, and pricePerFoot work correctly.",
                            6));
                    criteriaList.add(buildCriteria(rubric,
                            "toString implementation.",
                            "Formatted string output includes all required fields.",
                            2));
                    criteriaList.add(buildCriteria(rubric,
                            "FabricTester tests.",
                            "Tester program exercises constructors and methods with clear output.",
                            3));

                    rubric.setCriteria(criteriaList);
                    return rubricRepository.save(rubric);
                });
    }

    private void seedTestSuites(
            Assignment jukeboxAssignment,
            Assignment initialsAssignment,
            Assignment wordLengthAssignment,
            Assignment pricesAssignment,
            Assignment fabricAssignment
    ) {
        // Digital Jukebox tests (stdin).
        TestSuite jukeboxSuite = getOrCreateTestSuite(
                jukeboxAssignment,
                "Digital Jukebox Public Tests",
                "Public test cases for the Digital Jukebox assignment (seed_database.md)."
        );
        addPublicTestCaseIfMissing(
                jukeboxSuite,
                "Single song repeated three times",
                "Bohemian Rhapsody\nQueen\n3\n",
                null,
                "Subtotal: 1.50\nTax: 0.17\nTotal: 1.67\n"
        );

        // Initials Generator tests (stdin).
        TestSuite initialsSuite = getOrCreateTestSuite(
                initialsAssignment,
                "Initials Generator Public Tests",
                "Public test cases for the Initials Generator assignment (seed_database.md)."
        );
        addPublicTestCaseIfMissing(
                initialsSuite,
                "First and last name, first-initial option",
                "Jane Doe\n1\n",
                null,
                "Initials: J.\n"
        );

        // Word Length Counter tests (stdin, loop with a stop word).
        TestSuite wordLengthSuite = getOrCreateTestSuite(
                wordLengthAssignment,
                "Word Length Counter Public Tests",
                "Public test cases for the while-loops word length assignment (seed_database.md)."
        );
        addPublicTestCaseIfMissing(
                wordLengthSuite,
                "Two qualifying words and one short word, then stop",
                "hello\nhi\nwonderful\nSTOP\n",
                null,
                "Count (5-10 letters): 2\nWords: hello, wonderful\n"
        );

        // Price Range Analyzer tests (file input).
        TestSuite pricesSuite = getOrCreateTestSuite(
                pricesAssignment,
                "Price Range Analyzer Public Tests",
                "Public test cases for the random prices file assignment (seed_database.md)."
        );
        addPublicTestCaseIfMissing(
                pricesSuite,
                "Small price file with three ranges",
                "1.25\n15.50\n42.10\n",
                "prices_sample.txt",
                "Sum: 58.85\n0.00-9.99: 1\n10.00-19.99: 1\n40.00-49.99: 1\n"
        );

        // Fabric assignment simple smoke test (no input expected).
        TestSuite fabricSuite = getOrCreateTestSuite(
                fabricAssignment,
                "Fabric Project Public Tests",
                "Basic smoke test for the Fabric class and FabricTester assignment (seed_database.md)."
        );
        addPublicTestCaseIfMissing(
                fabricSuite,
                "Default Fabric constructor test",
                "",
                null,
                "Fabric Tester Completed\n"
        );
    }

    private TestSuite getOrCreateTestSuite(Assignment assignment, String title, String description) {
        return testSuiteRepository.findByAssignment_Id(assignment.getId())
                .orElseGet(() -> {
                    TestSuite suite = new TestSuite();
                    suite.setAssignment(assignment);
                    suite.setTitle(title);
                    suite.setDescription(description);
                    return testSuiteRepository.save(suite);
                });
    }

    private void addPublicTestCaseIfMissing(
            TestSuite suite,
            String title,
            String input,
            String fileName,
            String expectedOutput
    ) {
        boolean exists = suite.getTestCases()
                .stream()
                .anyMatch(tc -> title.equals(tc.getTitle()));
        if (exists) {
            return;
        }
        TestCase testCase = new TestCase();
        testCase.setTitle(title);
        testCase.setIsPrivate(false);
        testCase.setInput(input);
        testCase.setFileName(fileName);
        testCase.setOutput(expectedOutput);
        testCase.setTestSuite(suite);
        suite.getTestCases().add(testCase);
        testSuiteRepository.save(suite);
    }
}
