# Grading assistant guide — tasks

Reference for **grading assistants (GAs)**.

## Dashboard

- **Dashboard** (`/dashboard`) — shared shell with students/faculty styling appropriate to your role.

## Courses and classes

| Task | Where |
|------|--------|
| See courses you assist | **Courses** (`/grading-assistant/courses`) |
| Open a class | `/grading-assistant/class/:classId` |

## Assignments and grading

| Task | Where |
|------|--------|
| Open an assignment in a class | `/grading-assistant/class/:classId/assignment/:assignmentId` |
| Grade one submission | `/grading-assistant/class/:classId/assignment/:assignmentId/submission/:submissionId` → **Assignment grading** UI |

### Grading UI (same family as faculty)

- Tabs typically include **Description**, **Tests**, **Plagiarism & AI** (when reports exist or faculty run them), **Rubric**, **Group**.
- **Run tests** against the student’s submission or supplied files where supported.
- Enter scores and feedback according to permissions your instructor configured.

## Settings

| Task | Where |
|------|--------|
| Profile, security, notifications, appearance | **Settings** (`/settings`) |

## What grading assistants do *not* do

- Create or delete university-wide entities, semesters, or global courses.
- Create your own classes or assignments (unless you also have a **faculty** account).
- Access **University admin** screens.

If something is missing, ask the **course instructor** to confirm your course-assistant assignment in the system.
