# Grade Forge — Database Schema

Reference schema for implementation.

# TODOS
- test_cases
- rubric_items
- submissions
- submission_results
- audit_logs

---

## 1. Users & Roles

### 1.1 `users` (User)

Central authentication entity for all actors.

| Column       | Type    | Constraints              | Notes                    |
|-------------|---------|--------------------------|--------------------------|
| id          | Long    | PK, Auto-generated       |                          |
| email       | String  | Unique, Not Null         |                          |
| password    | String  | Not Null                 |        |
| first_name  | String  | Not Null                 |                          |
| last_name   | String  | Not Null                 |                          |
| role        | Enum    | Not Null                 | STUDENT, FACULTY, UNIVERSITY_ADMIN |
| is_active   | Boolean | Default: true            |                         |

---

### 1.2 `university_admin` (UniversityAdmin)

Extension of `User`. Global system settings.

| Column       | Type   | Constraints        | Notes                          |
|-------------|--------|---------------------|--------------------------------|
| user_id     | Long   | PK, FK → users.id   | One-to-One with User           |
| access_scope| JSON   |                     | `{}` as default value for now |
| preferences | JSON   |                     | `{}` as default value for now    |

---

### 1.3 `faculty` (Faculty)

Extension of `User`. Instructors who manage courses.

| Column        | Type   | Constraints        | Notes                    |
|---------------|--------|---------------------|--------------------------|
| user_id       | Long   | PK, FK → users.id   | One-to-One with User      |
| department    | String |                     | e.g. "Computer Science"  |
| title         | String |                     | e.g. "Associate Professor" |
| qualifications| String |                     | Degrees, certifications  |
| phone_number  | String |                     |                          |
| office_location | String |                  |                          |
| preferences   | JSON   |                     | `{}` as default for now  |

---

### 1.4 `students` (Student)

Extension of `User`.

| Column        | Type   | Constraints        | Notes                          |
|---------------|--------|---------------------|--------------------------------|
| user_id       | Long   | PK, FK → users.id   | One-to-One with User           |
| cwid          | String | Unique              | Campus Wide ID    |
| major         | String |                     |                                |
| canvas_user_id| String |                     | Placeholder if we need later  |
| preferences   | JSON   |                     | `{}` as default for now       |

---

## 2. Academic Structure

### 2.1 `semesters` (Semester)

Academic calendar timeline. Courses belong to a semester.

| Column     | Type   | Constraints        | Notes            |
|------------|--------|---------------------|------------------|
| id         | Long   | PK, Auto-generated  |                  |
| name       | String |                     | e.g. "Fall 2026" |
| start_date | Date   |                     |                  |
| end_date   | Date   |                     |                  |

---

### 2.2 `courses` (Course)

Class section (e.g. CS101-A).

| Column          | Type    | Constraints              | Notes                    |
|-----------------|---------|---------------------------|--------------------------|
| id              | Long    | PK, Auto-generated        |                          |
| faculty_id      | Long    | FK → faculty.user_id      | Instructor/owner         |
| semester_id      | Long    | FK → semesters.id        | When course runs         |
| name            | String  |                           | e.g. "Data Structures"   |
| course_code     | String  |                           | e.g. "CS-202"            |
| section         | String  |                           | e.g. "01" or "A"         |
| description     | Text    |                           | Syllabus/details         |
| image_url       | String  |                           | Course card image        |
| canvas_course_id| String  |                           | External roster sync     |
| is_published    | Boolean | Default: false           | If false, hidden from students |

---

### 2.3 `enrollments` (Enrollment)

Junction: Students ↔ Courses.

| Column     | Type    | Constraints              | Notes     |
|------------|---------|---------------------------|-----------|
| id         | Long    | PK, Auto-generated        |           |
| course_id  | Long    | FK → courses.id           |           |
| student_id | Long    | FK → students.user_id     |           |
| status     | Enum    |                           | ENROLLED, DROPPED, WAITLIST |
| enrolled_at| Timestamp |                     |           |

---

## 3. Course Content & Configuration

### 3.1 `programming_languages` (ProgrammingLanguage)

System-wide languages. University_ADMIN Managed

| Column         | Type    | Constraints        | Notes                          |
|----------------|---------|---------------------|--------------------------------|
| id             | Long    | PK, Auto-generated  |                                |
| name           | String  | Unique              | e.g. "Python 3.10", "Java 17"  |
| docker_image   | String  | Not Null            | Container image for execution   |
| execution_code | Text    |                     | e.g. `javac Main.java && java Main` |
| is_active      | Boolean | Default: true       | Admin can disable language     |

---

### 3.2 `assignments` (Assignment)

Work units created by faculty.

| Column           | Type     | Constraints                    | Notes                    |
|------------------|----------|---------------------------------|--------------------------|
| id               | Long     | PK, Auto-generated              |                          |
| course_id        | Long     | FK → courses.id                 |                          |
| language_id      | Long     | FK → programming_languages.id   | Language for grading     |
| name             | String   |                                  | Assignment title         |
| description      | Text     |                                  | Instructions/prompts     |
| total_points     | Integer  |                                  | Max score                |
| submission_type  | Enum     |                                  | INDIVIDUAL, GROUP        |
| starter_code_url | String   |                                  | S3/Blob template code    |
| available_from   | Timestamp|                                  | When submissions open    |
| due_date         | Timestamp|                                  | Soft deadline            |
| late_due_date    | Timestamp|                                  | Hard deadline (cutoff)   |

---

## 4. Relationship Mappings

### User 

- **User** (base)
  - **UniversityAdmin** — `@OneToOne` with User (`user_id` PK, FK)
  - **Faculty** — `@OneToOne` with User (`user_id` PK, FK)
  - **Student** — `@OneToOne` with User (`user_id` PK, FK)

---

### Academic structure

| Parent Entity | Relationship | Child Entity   | FK Column   | Inverse (Parent side)     |
|---------------|--------------|----------------|------------|---------------------------|
| **Semester**  | One-to-Many  | Course         | semester_id | `List<Course> courses`    |
| **Faculty**   | One-to-Many  | Course         | faculty_id  | `List<Course> courses`    |
| **Course**    | Many-to-One  | Semester       | semester_id | `Semester semester`       |
| **Course**    | Many-to-One  | Faculty        | faculty_id  | `Faculty faculty`         |
| **Course**    | One-to-Many  | Enrollment     | course_id   | `List<Enrollment> enrollments` |
| **Student**   | One-to-Many  | Enrollment     | student_id  | `List<Enrollment> enrollments` |
| **Enrollment**| Many-to-One  | Course         | course_id   | `Course course`           |
| **Enrollment**| Many-to-One  | Student        | student_id  | `Student student`         |

---

### Course content

| Parent Entity         | Relationship | Child Entity   | FK Column   | Inverse (Parent side)        |
|-----------------------|--------------|----------------|------------|------------------------------|
| **Course**            | One-to-Many  | Assignment     | course_id   | `List<Assignment> assignments` |
| **Assignment**        | Many-to-One  | Course         | course_id   | `Course course`              |
| **ProgrammingLanguage** | One-to-Many | Assignment     | language_id | `List<Assignment> assignments` |
| **Assignment**        | Many-to-One  | ProgrammingLanguage | language_id | `ProgrammingLanguage language` |

---

### Relation between Tables/Collections

```text
User
  └─ (no direct collections; subclasses hold FKs)

UniversityAdmin
  └─ @ManyToOne → User (user_id)

Faculty
  └─ @ManyToOne → User (user_id)
  └─ @OneToMany → Course (Course.faculty_id)

Student
  └─ @ManyToOne → User (user_id)
  └─ @OneToMany → Enrollment (Enrollment.student_id)

Semester
  └─ @OneToMany → Course (Course.semester_id)

Course
  └─ @ManyToOne → Faculty (faculty_id)
  └─ @ManyToOne → Semester (semester_id)
  └─ @OneToMany → Enrollment (Enrollment.course_id)
  └─ @OneToMany → Assignment (Assignment.course_id)

Enrollment
  └─ @ManyToOne → Course (course_id)
  └─ @ManyToOne → Student (student_id)

ProgrammingLanguage
  └─ @OneToMany → Assignment (Assignment.language_id)

Assignment
  └─ @ManyToOne → Course (course_id)
  └─ @ManyToOne → ProgrammingLanguage (language_id)
```

---

### Suggested `@JoinColumn` names

| Entity        | Field / Collection   | @JoinColumn(name = "...") |
|---------------|----------------------|---------------------------|
| UniversityAdmin | user                 | "user_id"                 |
| Faculty       | user                 | "user_id"                 |
| Student       | user                 | "user_id"                 |
| Course        | faculty              | "faculty_id"              |
| Course        | semester             | "semester_id"             |
| Enrollment    | course               | "course_id"               |
| Enrollment    | student              | "student_id"              |
| Assignment    | course               | "course_id"               |
| Assignment    | language             | "language_id"             |

