# Faculty guide — tasks

Reference for **instructors** using Grade-Forge.

## Dashboard and navigation

- **Dashboard** (`/dashboard`) — entry point after sign-in.
- Legacy **`/faculty/grading`** redirects to **My Classes**; grade from each class’s assignments.

## Classes

| Task | Where |
|------|--------|
| List your classes | **My Classes** (`/faculty/my-classes`) |
| Create a class | **My Classes** → create (`/faculty/my-classes/create`) |
| Open a class | **Faculty class** shell (`/faculty/class/:classId/:section`) — e.g. dashboard, roster, assignments |
| Inspect a student in the class | Class path with **students/:studentId** |
| Manage **main groups** | **groups/:mainGroupId** from the class workflow |

## Assignments

| Task | Where |
|------|--------|
| Create assignment | From the class → create assignment (`/faculty/class/:classId/assignments/create`) |
| Edit assignment | `/faculty/class/:classId/assignments/:assignmentId/edit` |
| Open assignment in “management” context | `/faculty/assignment/:assignmentId` (and deep links with `submission/:submissionId` when applicable) |
| Assignment detail / grading overview | `/faculty/class/:classId/assignment/:assignmentId` |

Assignment pages support the same rich **code workspace** as students where relevant: description, tests, rubric, groups, plus faculty-specific grading entry points.

## Grading

| Task | Where |
|------|--------|
| Grade a specific submission | **Assignment grading** (`/faculty/class/:classId/assignment/:assignmentId/submission/:submissionId`) |
| Alternate grading route | `/assignment/:assignmentId/grade/:submissionId` |
| Speed through submissions for one assignment | **Speed grading** (`/faculty/class/:classId/speed-grading/:assignmentId`) |

### While grading a submission

- Review description, **tests** (run against submission or ad-hoc files as supported), **rubric**, and **group** context.
- **Plagiarism & AI** — tab for similarity / AI-signal reports when enabled: faculty can **run** a report for the assignment and inspect per-student results (generation may be asynchronous).
- Enter marks and feedback; save/submit per your UI flow.

## Rubrics

| Task | Where |
|------|--------|
| List rubrics | **Rubrics** (`/faculty/rubrics`) |
| Create rubric | `/faculty/rubrics/new` |
| Edit / view rubric | `/faculty/rubrics/:rubricId` |

## Grading assistants

| Task | Where |
|------|--------|
| Manage GAs tied to your work | **Grading Assistants** (`/faculty/grading-assistants`) |

## Students roster and search

| Task | Where |
|------|--------|
| Faculty-wide student tools / search | **Students** (`/faculty/students`) |

## Schedule, materials, discussions

| Task | Where |
|------|--------|
| Schedule | **Schedule** (`/faculty/schedule`) |
| Materials | **Materials** (`/faculty/materials`) |
| Discussions | **Discussions** (`/faculty/discussions`) |

## Settings

| Task | Where |
|------|--------|
| Profile, security, notifications, appearance | **Settings** (`/settings`) |

## What faculty typically do *not* do

- Institution-wide semesters, global course catalog ownership, or system-wide user provisioning — **university admin** (unless you also hold that role elsewhere).
