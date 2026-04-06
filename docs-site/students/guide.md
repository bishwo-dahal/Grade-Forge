# Student guide — tasks

Concise reference for everything you can do as a **student** in Grade-Forge.

## Dashboard

- Land on **Dashboard** after sign-in (`/dashboard`).
- Use it as the home base; open the sidebar to reach other areas.

## Courses and classes

| Task | Where |
|------|--------|
| See enrolled courses | **My Courses** (`/student/my-courses`) |
| Open a course | Click a course → **Course** page (`/course/:courseId`) |
| Enter a class section | From the course, open a **class** (`/class/:classId`) |
| View class context | Class page shows assignments and class-specific navigation |

## Assignments

| Task | Where |
|------|--------|
| See all assignments in one place | **Assignments** (`/student/assignments`) |
| Open an assignment | **Assignment** page (`/assignment/:assignmentId`) |

### On the assignment page

- **Description** — requirements and instructions.
- **Tests** — run automated checks:
  - Add or edit code in the **editor** (multi-file tree when supported).
  - Or **upload** a source file when allowed (e.g. `.py`, `.java`, depending on the assignment language).
  - **Run tests** on your current editor files or, after you have a submission, against your latest submission.
  - Optional **custom stdin** when the assignment allows it.
- **Rubric** — how you will be graded (read-only preview).
- **Group** — subgroup membership and teammates when the assignment uses groups.
- **Results** — submission status, prior runs, and outcomes as exposed by your instructor’s setup.

### Submitting

- Use **Submit** when the workspace is in student mode: you must have **uploaded an allowed file** or **non-empty code** in the editor (per validation messages).
- Confirm in the submit dialog; late policies depend on your instructor.

## Calendar, materials, discussions

| Task | Where |
|------|--------|
| View schedule-oriented information | **Calendar** (`/student/calendar`) |
| Course materials | **Materials** (`/student/materials`) |
| Discussions | **Discussions** (`/student/discussions`) |

## Profile and account

| Task | Where |
|------|--------|
| Name, photo, preferences | **Settings** (`/settings`) — profile, security, notifications, appearance |
| Finish initial enrollment steps | **Complete registration** (`/complete-registration`) if required |

## What students do *not* do

- Create classes or assignments, edit rubrics, or run university-wide configuration — those are **faculty** and **university admin** roles.
