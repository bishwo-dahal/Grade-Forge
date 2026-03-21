# Grade Forge Controller APIs

Reference for REST controllers, grouped by package. Each endpoint lists purpose, request JSON (if applicable), and illustrative response JSON derived from DTOs/entities.

## assignment
**AssignmentController** (`/api/v1/faculty/assignments`, FACULTY)
- POST `/` create assignment
  - Request
    ```json
    {
      "courseId": 10,
      "languageId": 3,
      "name": "Project 1",
      "description": "Intro project",
      "totalPoints": 100,
      "submissionType": "FILE",  
      "starterCodeUrl": "https://s3.com/starter.zip",
      "availableFrom": "2024-08-01T00:00:00",
      "dueDate": "2024-08-15T23:59:00",
      "lateDueDate": "2024-08-18T23:59:00",
      "rubricId": 5
    }
    ```
  - Response (201)
    ```json
    {
      "id": 21,
      "courseId": 10,
      "courseName": "CS101",
      "languageId": 3,
      "languageName": "Java",
      "name": "Project 1",
      "description": "Intro project",
      "totalPoints": 100,
      "submissionType": "FILE",
      "starterCodeUrl": "https://s3.com/starter.zip",
      "availableFrom": "2024-08-01T00:00:00",
      "dueDate": "2024-08-15T23:59:00",
      "lateDueDate": "2024-08-18T23:59:00",
      "rubricId": 5,
      "rubricName": "Project Rubric"
    }
    ```
- GET `/{id}` fetch by id → same response shape as above.
- GET `/course/{courseId}` list for course → `[{AssignmentResponse}, ...]`.
- GET `/all` list all → `[{AssignmentResponse}, ...]`.
- PUT `/{id}` update → Request same as create; Response `AssignmentResponse`.
- DELETE `/{id}` delete → Response: plain string `"Assignment deleted successfully"`.

**AssignmentStudentController** (`/api/v1/student/assignments`, STUDENT)
- GET `/course/{courseId}` list assignments for course → `[{AssignmentResponse}, ...]`.

**GraderReportFacultyController** (`/api/v1/faculty/assignments`, FACULTY)
- POST `/{assignmentId}/grader-report` trigger report generation (manual). No body. Returns 202 Accepted with `GraderReportResponse` (id, assignmentId, generatedAt, triggerType, status=PENDING, errorMessage=null, result=null). Client can poll GET latest until status is COMPLETED or FAILED.
- GET `/{assignmentId}/grader-report/latest` get latest grader report for assignment. Returns 200 with `GraderReportResponse` (id, assignmentId, generatedAt, triggerType, status, errorMessage, result=full pipeline JSON when COMPLETED). Returns 404 if no report exists.

## auth
**AuthController** (`/api/v1/auth`)
- POST `/login`
  - Request
    ```json
    { "email": "alice@example.com", "password": "Secret1!" }
    ```
  - Response
    ```json
    {
      "token": "jwt-token",
      "userId": "42",
      "email": "alice@example.com",
      "name": "Alice",
      "role": "STUDENT",
      "message": "Login successful"
    }
    ```
- POST `/signup`
  - Request
    ```json
    { "name": "Alice", "email": "alice@example.com", "password": "Secret1!", "role": "STUDENT" }
    ```
  - Response (201): `AuthResponse` as above.
- POST `/update-password`
  - Request
    ```json
    { "email": "alice@example.com", "oldPassword": "Old1!", "newPassword": "New1!" }
    ```
  - Response: `AuthResponse`.
- POST `/reset-password`
  - Request
    ```json
    { "email": "alice@example.com", "resetToken": "abc123", "newPassword": "New1!" }
    ```
  - Response: `AuthResponse`.
- GET `/user/{userId}` or `/user/email/{email}`
  - Response (Users entity)
    ```json
    {
      "id": 42,
      "name": "Alice",
      "email": "alice@example.com",
      "password": "<hashed>",
      "role": "STUDENT",
      "faculty": null,
      "student": null
    }
    ```

## coursemgmt
**AdminCourseController** (`/api/v1/university_admin/faculty/courses`, UNIVERSITY_ADMIN)
- GET `/getAll` → `[{CourseResponseDto}, ...]`
- GET `/user/{facultyId}` → `[{CourseResponseDto}, ...]`
- PATCH `/disable/{id}` → `CourseResponseDto`
- DELETE `/{id}` → plain string `"Course deleted successfully"`

**FacultyCourseController** (`/api/v1/faculty/courses`, FACULTY)
- POST `/create`
  - Request
    ```json
    {
      "name": "CS101",
      "courseCode": "CS101",
      "section": "A",
      "description": "Intro course",
      "imageUrl": "https://cdn/img.png",
      "canvasCourseId": "12345",
      "isPublished": true,
      "semesterId": 2,
      "active": true,
      "facultyId": 7
    }
    ```
  - Response (201): `CourseResponseDto`
    ```json
    {
      "id": 11,
      "name": "CS101",
      "courseCode": "CS101",
      "section": "A",
      "description": "Intro course",
      "imageUrl": "https://cdn/img.png",
      "canvasCourseId": "12345",
      "active": true,
      "isPublished": true,
      "semester": { "id": 2, "name": "Fall 2024", "startDate": "2024-08-20", "endDate": "2024-12-15" },
      "faculty": { "id": 7, "name": "Prof Smith", "email": "smith@u.edu", "department": "CS", "qualifications": "PhD" }
    }
    ```
- GET `/{id}` → `CourseResponseDto`
- GET `/` → `[{CourseResponseDto}, ...]`
- GET `/active` → `[{CourseResponseDto}, ...]`
- PUT `/{id}` update → Request same as create; Response `CourseResponseDto`
- PATCH `/disable/{id}` → `CourseResponseDto`
- DELETE `/{id}` → plain string `"Course deleted successfully"`

**StudentClassController** (`/api/v1/student/classes`, STUDENT)
- GET `/` → `[{CourseResponseDto}, ...]`
- GET `/{courseId}` → `CourseResponseDto`
- GET `/enrolled` → `[{CourseResponseDto}, ...]`
- GET `/waitlisted` → `[{EnrollmentResponse}, ...]`
  ```json
  {
    "id": 90,
    "studentId": 15,
    "studentName": "Alice",
    "courseId": 11,
    "enrolledAt": "2024-08-02T10:00:00",
    "enrolledStatus": "WAITLISTED",
    "grade": null
  }
  ```
- POST `/{courseId}/enroll` waitlist current student → Response `EnrollmentResponse` (201)

## faculty
**FacultyAdminController** (`/api/v1/university_admin/faculty`, UNIVERSITY_ADMIN)
- POST `/create`
  - Request
    ```json
    {
      "name": "Prof Smith",
      "email": "smith@u.edu",
      "department": "CS",
      "qualifications": "PhD",
      "phoneNumber": "555-1234",
      "officeLocation": "Room 101",
      "password": "TempPass1!"
    }
    ```
  - Response (201)
    ```json
    {
      "facultyId": 7,
      "name": "Prof Smith",
      "department": "CS",
      "qualifications": "PhD",
      "phoneNumber": "555-1234",
      "officeLocation": "Room 101",
      "active": true,
      "userId": 42,
      "email": "smith@u.edu",
      "role": "FACULTY"
    }
    ```
- GET `/{id}` → `FacultyResponse`
- PUT `/{id}` update (Request uses `Faculty` entity fields; mirror response fields) → `FacultyResponse`
- PATCH `/disable/{id}` → `FacultyResponse`
- GET `/department/{department}` → `[{FacultyResponse}, ...]`
- GET `/all` → `[{FacultyResponse}, ...]`
- GET `/active` → `[{FacultyResponse}, ...]`
- DELETE `/{id}` → plain string `"Faculty deleted successfully"`

**FacultyController** (`/api/v1/faculty`, FACULTY)
- GET `/me` → `FacultyResponse`
- PUT `/me` update → Request `FacultyUpdateRequest`; Response `FacultyResponse`

**GradingAssistantController** (`/api/v1/grading-assistants`, GRADING_ASSISTANT)
- GET `/me` → `GradingAssistantResponse`

## grading
**SubmissionGradeController** (`/api/v1/faculty/submission-grades`, FACULTY)
- POST `/`
  - Request
    ```json
    { "submissionId": 50, "rubricCriteriaId": 8, "awardedScore": 9, "feedback": "Good job" }
    ```
  - Response (201)
    ```json
    {
      "id": 101,
      "submissionId": 50,
      "rubricCriteriaId": 8,
      "rubricCriteriaTitle": "Correctness",
      "awardedScore": 9,
      "feedback": "Good job"
    }
    ```
- PUT `/{id}` update → Request same; Response `SubmissionGradeResponse`
- GET `/{id}` → `SubmissionGradeResponse`
- GET `/` (query `submissionId`) → `[{SubmissionGradeResponse}, ...]`
- DELETE `/{id}` → empty body (204)

**SubmissionGradeStudentController** (`/api/v1/student/submission-grades`, STUDENT)
- GET `/` (query `submissionId`) → `[{SubmissionGradeResponse}, ...]`
- GET `/{id}` → `SubmissionGradeResponse`

## programminglanguage
**ProgrammingLanguageAdminController** (`/api/v1/university_admin/programming-languages`, UNIVERSITY_ADMIN)
- POST `/`
  - Request
    ```json
    { "name": "Java", "dockerImage": "openjdk:17", "executionCode": "javac Main.java", "isActive": true }
    ```
  - Response (201)
    ```json
    { "id": 3, "name": "Java", "dockerImage": "openjdk:17", "executionCode": "javac Main.java", "isActive": true }
    ```
- GET `/{id}` → `ProgrammingLanguageResponse`
- GET `/all` → `[{ProgrammingLanguageResponse}, ...]`
- GET `/active` → `[{ProgrammingLanguageResponse}, ...]`
- PUT `/{id}` → Request same as create; Response `ProgrammingLanguageResponse`
- PATCH `/disable/{id}` → `ProgrammingLanguageResponse`
- DELETE `/{id}` → plain string `"Programming language deleted successfully"`

**ProgrammingLanguageFacultyController** (`/api/v1/faculty/programming-languages`, FACULTY)
- GET `/{id}` → `ProgrammingLanguageResponse`
- GET `/all` → `[{ProgrammingLanguageResponse}, ...]`

## rubric
**RubricController** (`/api/v1/faculty/rubrics`, FACULTY)
- POST `/`
  - Request
    ```json
    {
      "name": "Project Rubric",
      "description": "Scoring for project",
      "facultyId": 7,
      "criteria": [
        { "title": "Correctness", "description": "Meets requirements", "maxScore": 60, "weight": 0.6 },
        { "title": "Style", "description": "Code quality", "maxScore": 40, "weight": 0.4 }
      ]
    }
    ```
  - Response (201)
    ```json
    {
      "id": 5,
      "name": "Project Rubric",
      "description": "Scoring for project",
      "facultyId": 7,
      "criteria": [
        { "id": 8, "title": "Correctness", "description": "Meets requirements", "maxScore": 60, "weight": 0.6 },
        { "id": 9, "title": "Style", "description": "Code quality", "maxScore": 40, "weight": 0.4 }
      ]
    }
    ```
- PUT `/{id}` update → Request same; Response `RubricResponse`
- GET `/{id}` → `RubricResponse`
- DELETE `/{id}` → plain string `"Rubric deleted successfully"`
- GET `/faculty/me` → `[{RubricResponse}, ...]`

## semester
**SemesterAdminController** (`/api/v1/university_admin/semester`, UNIVERSITY_ADMIN)
- POST `/`
  - Request
    ```json
    { "name": "Fall 2024", "startDate": "2024-08-20", "endDate": "2024-12-15" }
    ```
  - Response (201)
    ```json
    { "id": 2, "name": "Fall 2024", "startDate": "2024-08-20", "endDate": "2024-12-15" }
    ```
- GET `/{id}` → `SemesterResponseDto`
- GET `/all` → `[{SemesterResponseDto}, ...]`
- PUT `/{id}` → Request same as create; Response `SemesterResponseDto`
- DELETE `/{id}` → plain string `"Semester deleted successfully"`

**SemesterFacultyController** (`/api/v1/faculty/semester`, FACULTY)
- GET `/all` → `[{SemesterResponseDto}, ...]`

## student
**StudentController** (`/api/v1/students`)
- POST `/`
  - Request
    ```json
    { "userId": 42, "cwid": "A123456", "major": "CS", "canvasUserId": "c-789", "preferences": { "theme": "dark" } }
    ```
  - Response (201)
    ```json
    { "id": 15, "userId": 42, "cwid": "A123456", "major": "CS", "canvasUserId": "c-789", "preferences": { "theme": "dark" } }
    ```
- GET `/me` → `StudentResponse`
- GET `/` → `[{StudentResponse}, ...]`
- PUT `/me` update → Request same as create; Response `StudentResponse`
- DELETE `/{id}` → empty body (204)

**EnrollmentStudentController** (`/api/v1/student/enrollments`, STUDENT)
- POST `/{courseId}` waitlist current student → Response `EnrollmentResponse` (201)
- PATCH `/{courseId}/drop` drop current student → Response `EnrollmentResponse`
- GET `/` list current student enrollments → `[{EnrollmentResponse}, ...]`

**EnrollmentFacultyController** (`/api/v1/faculty/enrollments`, FACULTY)
- GET `/course/{courseId}` → `[{EnrollmentResponse}, ...]`
- PATCH `/{studentId}/enroll/{courseId}` approve/enroll → `EnrollmentResponse`
- PATCH `/{studentId}/drop/{courseId}` drop student → `EnrollmentResponse`

## submission
**SubmissionController** (`/api/v1/student/submissions`, STUDENT)
- POST `/` (multipart)
  - Request parts: `assignmentId` (query param) and `files` (multipart list)
  - Response (201)
    ```json
    {
      "id": 200,
      "assignmentId": 21,
      "assignmentName": "Project 1",
      "courseId": 10,
      "courseName": "CS101",
      "studentId": 15,
      "studentName": "Alice",
      "studentEmail": "alice@example.com",
      "files": [
        {
          "id": 1,
          "fileName": "main.java",
          "fileKey": "submissions/200/main.java",
          "fileType": "text/x-java-source",
          "fileSize": 2048,
          "downloadUrl": "https://s3.com/submissions/200/main.java"
        }
      ],
      "marks": null,
      "feedback": null,
      "submittedAt": "2024-08-05T12:00:00",
      "status": "SUBMITTED"
    }
    ```
- GET `/{submissionId}` → `SubmissionResponse`
- GET `/assignment` (query `assignmentId`) → `[{SubmissionResponse}, ...]`

**SubmissionFacultyController** (`/api/v1/faculty/submissions`, FACULTY)
- GET `/` (query `assignmentId`) → `[{SubmissionResponse}, ...]`
- PUT `/{submissionId}/grade`
  - Request
    ```json
    { "marks": 95.0, "feedback": "Excellent work" }
    ```
  - Response
    ```json
    {
      "id": 200,
      "assignmentId": 21,
      "assignmentName": "Project 1",
      "courseId": 10,
      "courseName": "CS101",
      "studentId": 15,
      "studentName": "Alice",
      "studentEmail": "alice@example.com",
      "files": [ { "id": 1, "fileName": "main.java", "fileKey": "submissions/200/main.java", "fileType": "text/x-java-source", "fileSize": 2048, "downloadUrl": "https://s3.com/submissions/200/main.java" } ],
      "marks": 95.0,
      "feedback": "Excellent work",
      "submittedAt": "2024-08-05T12:00:00",
      "status": "GRADED"
    }
    ```

## university
**UniversityAdminController** (`/api/v1/system_admin/university`, SYSTEM_ADMIN)
- POST `/create`
  - Request
    ```json
    { "name": "Acme University", "active": true }
    ```
  - Response (201)
    ```json
    { "id": 1, "name": "Acme University", "active": true, "createTime": "2024-08-01T12:00:00Z" }
    ```
- PATCH `/disable/{name}` → Response
  ```json
  { "id": 1, "name": "Acme University", "active": false, "createTime": "2024-08-01T12:00:00Z" }
  ```

## exceptionhandler
**GlobalExceptionHandling** (`@RestControllerAdvice`)
- Error response shape
  ```json
  { "message": "Reason for failure", "statusCode": 400, "isSuccess": false }
  ```

## packages without controllers (current code)
- `audit`, `configuration`, `storage`, `test`, `user` — no REST controllers detected.
