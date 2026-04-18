# All actions by role

Every entry lists **steps**, **Path**, and an **example URL** when it helps. Example host and ids are samples. See [URLs in this manual](../conventions).

**More detail** links go to topic pages under [Features](../features/sign-in-and-account).

![All actions index in the documentation site](/manual/images/manual-actions.png)

---

## Everyone (before sign-in)

### Create an account

**Role:** Anyone (if your school allows self sign-up)

1. Open **Sign up**.
2. Complete the form and submit.

**Path:** `/signup`  
**Example URL:** `https://gradeforge.tech/signup`  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

### Sign in

**Role:** Anyone with an account

1. Open **Sign in**.
2. Enter email and password (or your school’s method).

**Path:** `/signin`  
**Example URL:** `https://gradeforge.tech/signin`  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

---

## Student

### Finish first-time registration (if required)

**Role:** Student

1. After sign-in, if prompted, open **Complete registration**.
2. Fill required fields and save.

**Path:** `/complete-registration`  
**Example URL:** `https://gradeforge.tech/complete-registration`  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

### Open the student dashboard

**Role:** Student

1. Sign in as a student.
2. You land on **Dashboard**, or open it from the sidebar.

**Path:** `/dashboard`  
**Example URL:** `https://gradeforge.tech/dashboard`

### Change profile, password, notifications, or appearance

**Role:** Student

1. Open **Settings** in the sidebar.
2. Pick a section (profile, security, notifications, appearance) and save changes.

**Path:** `/settings`  
**Example URL:** `https://gradeforge.tech/settings`  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

### View enrolled courses

**Role:** Student

1. Open **My courses** in the sidebar.

**Path:** `/student/my-courses`  
**Example URL:** `https://gradeforge.tech/student/my-courses`  
**More detail:** [Courses and classes](../features/courses-and-classes)

### Open a course

**Role:** Student

1. From **My courses**, select a course.

**Path:** `/course/{courseId}`  
**Example URL:** `https://gradeforge.tech/course/3`

### Open a class section

**Role:** Student

1. From the course view, open a class (section).

**Path:** `/class/{classId}`  
**Example URL:** `https://gradeforge.tech/class/4`

### View all assignments in one list

**Role:** Student

1. Open **Assignments** in the sidebar.

**Path:** `/student/assignments`  
**Example URL:** `https://gradeforge.tech/student/assignments`

### Open an assignment workspace

**Role:** Student

1. From **Assignments**, the class page, or a link from your instructor, open an assignment.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Assignments and editor](../features/assignments-and-editor)

### Read assignment instructions

**Role:** Student

1. On the assignment, open the **Description** tab.

**Path:** `/assignment/{assignmentId}` (Description tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`

### Run tests using your current editor files

**Role:** Student

1. Open the assignment **Tests** tab.
2. Add or edit files in the editor (or upload if the UI offers it).
3. Choose **Run tests** (wording may be **Run** or similar).

**Path:** `/assignment/{assignmentId}` (Tests tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### Run tests with custom standard input (when allowed)

**Role:** Student

1. Open the **Tests** tab.
2. If **custom stdin** is shown, enter the input text.
3. Run tests as above.

**Path:** `/assignment/{assignmentId}` (Tests tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### Run tests against your latest submission

**Role:** Student (after at least one submission exists)

1. Open the **Tests** tab.
2. Run tests using the control that targets the **latest submission** (no new files required in the editor).

**Path:** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### View the rubric (read-only)

**Role:** Student

1. Open the **Rubric** tab on the assignment.

**Path:** `/assignment/{assignmentId}` (Rubric tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### View your group for a group assignment

**Role:** Student

1. Open the **Group** tab on the assignment.

**Path:** `/assignment/{assignmentId}` (Group tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### Submit the assignment

**Role:** Student

1. Add code in the editor or upload an allowed source file (the page will say what is missing if you cannot submit).
2. Use **Submit** and confirm in the dialog.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### See results, test output, and instructor feedback or grades

**Role:** Student

1. Open the assignment.
2. Use the **Results** tab (and related areas) for submission status, test runs, and any grades or feedback your instructor released.

**Path:** `/assignment/{assignmentId}` (Results tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`  
**More detail:** [Grading and feedback](../features/grading-and-feedback)

### Open calendar, materials, or discussions

**Role:** Student

1. Use **Calendar**, **Materials**, or **Discussions** in the sidebar.

**Path:** `/student/calendar`, `/student/materials`, `/student/discussions`  
**Example URL:** `https://gradeforge.tech/student/calendar`  
**More detail:** [Calendar, materials, discussions](../features/calendar-materials-discussions)

---

## Faculty

### Open the faculty dashboard

**Role:** Faculty

1. Sign in and use **Dashboard** from the sidebar.

**Path:** `/dashboard`  
**Example URL:** `https://gradeforge.tech/dashboard`

### Change profile, password, notifications, or appearance

**Role:** Faculty

1. Open **Settings** in the sidebar.

**Path:** `/settings`  
**Example URL:** `https://gradeforge.tech/settings`

### List your classes

**Role:** Faculty

1. Open **My classes**.

**Path:** `/faculty/my-classes`  
**Example URL:** `https://gradeforge.tech/faculty/my-classes`  
**More detail:** [Courses and classes](../features/courses-and-classes)

### Create a new class

**Role:** Faculty

1. Open **My classes** then **Create** (or the create class action).

**Path:** `/faculty/my-classes/create`  
**Example URL:** `https://gradeforge.tech/faculty/my-classes/create`

### Open a class section (dashboard, roster, assignments, …)

**Role:** Faculty

1. From **My classes**, open a class. Sections use paths like `dashboard`, `assignments`, `students`, `grades`, `groups` after the class id.

**Path:** `/faculty/class/{classId}/{section}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/dashboard`

### Create an assignment in a class

**Role:** Faculty

1. Open the class, go to **Assignments**, start **Create assignment**.

**Path:** `/faculty/class/{classId}/assignments/create`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/assignments/create`  
**More detail:** [Assignments and editor](../features/assignments-and-editor)

### Edit an existing assignment

**Role:** Faculty

1. From the class assignments list, choose **Edit** for an assignment.

**Path:** `/faculty/class/{classId}/assignments/{assignmentId}/edit`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/assignments/12/edit`

### Open an assignment in management context (from class flow)

**Role:** Faculty

1. Use the assignment link from the class **Assignments** tab or equivalent.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/assignment/12`  
**More detail:** [Assignments and editor](../features/assignments-and-editor)

### Open an assignment by id (shortcut route)

**Role:** Faculty

1. Navigate to `/faculty/assignment/{assignmentId}` when you have a direct link.

**Path:** `/faculty/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/faculty/assignment/12`

### Open a specific submission from an assignment shortcut

**Role:** Faculty

1. Use a link that includes `submission` in the path.

**Path:** `/faculty/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** `https://gradeforge.tech/faculty/assignment/12/submission/99`

### Grade one submission (full grading workspace)

**Role:** Faculty

1. From the class assignment view or submission list, open a submission.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/assignment/12/submission/99`  
**More detail:** [Grading and feedback](../features/grading-and-feedback)

### Use speed grading for one assignment

**Role:** Faculty

1. From the class, open **Speed grading** for the assignment (wording may vary).

**Path:** `/faculty/class/{classId}/speed-grading/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/speed-grading/12`

### Open student detail inside a class

**Role:** Faculty

1. From the class **Students** area, open a student.

**Path:** `/faculty/class/{classId}/students/{studentId}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/students/7`

### Open main group detail

**Role:** Faculty

1. From class **Groups**, open a main group.

**Path:** `/faculty/class/{classId}/groups/{mainGroupId}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/groups/2`  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### Alternate grading route (legacy path)

**Role:** Faculty

1. Some links use `/assignment/{assignmentId}/grade/{submissionId}`.

**Path:** `/assignment/{assignmentId}/grade/{submissionId}`  
**Example URL:** `https://gradeforge.tech/assignment/12/grade/99`

### List and manage rubrics

**Role:** Faculty

1. Open **Rubrics** in the sidebar.

**Path:** `/faculty/rubrics`  
**Example URL:** `https://gradeforge.tech/faculty/rubrics`  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### Create a rubric

**Role:** Faculty

1. From **Rubrics**, start **New**.

**Path:** `/faculty/rubrics/new`  
**Example URL:** `https://gradeforge.tech/faculty/rubrics/new`

### Edit or view one rubric

**Role:** Faculty

1. Open a rubric from the list.

**Path:** `/faculty/rubrics/{rubricId}`  
**Example URL:** `https://gradeforge.tech/faculty/rubrics/5`

### Manage grading assistants

**Role:** Faculty

1. Open **Grading assistants** in the sidebar.

**Path:** `/faculty/grading-assistants`  
**Example URL:** `https://gradeforge.tech/faculty/grading-assistants`  
**More detail:** [Grading assistants](../features/grading-assistants)

### Faculty student search or roster tools

**Role:** Faculty

1. Open **Students** in the sidebar.

**Path:** `/faculty/students`  
**Example URL:** `https://gradeforge.tech/faculty/students`

### Schedule, materials, discussions

**Role:** Faculty

1. Use **Schedule**, **Materials**, or **Discussions** in the sidebar.

**Path:** `/faculty/schedule`, `/faculty/materials`, `/faculty/discussions`  
**Example URL:** `https://gradeforge.tech/faculty/schedule`  
**More detail:** [Calendar, materials, discussions](../features/calendar-materials-discussions)

### Run Plagiarism and AI analysis for an assignment (faculty)

**Role:** Faculty

1. Open a submission in the grading workspace.
2. Open the **Plagiarism and AI** tab.
3. Use **Run** when shown and wait for the job to finish.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}/submission/{submissionId}` (Plagiarism tab)  
**Example URL:** `https://gradeforge.tech/faculty/class/4/assignment/12/submission/99`  
**More detail:** [Plagiarism and AI reports](../features/plagiarism-and-ai-reports)

---

## Grading assistant

### List courses you assist

**Role:** Grading assistant

1. Open **Courses** in the sidebar (grading assistant shell).

**Path:** `/grading-assistant/courses`  
**Example URL:** `https://gradeforge.tech/grading-assistant/courses`  
**More detail:** [Grading assistants](../features/grading-assistants)

### Open a class as a GA

**Role:** Grading assistant

1. From **Courses**, select a class.

**Path:** `/grading-assistant/class/{classId}`  
**Example URL:** `https://gradeforge.tech/grading-assistant/class/4`

### Open an assignment in that class

**Role:** Grading assistant

1. From the class view, open an assignment.

**Path:** `/grading-assistant/class/{classId}/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/grading-assistant/class/4/assignment/12`

### Grade a submission

**Role:** Grading assistant

1. Open a submission from the assignment view.

**Path:** `/grading-assistant/class/{classId}/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** `https://gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99`  
**More detail:** [Grading and feedback](../features/grading-and-feedback)

### Change GA account settings

**Role:** Grading assistant

1. Open **Settings** in the sidebar.

**Path:** `/settings`  
**Example URL:** `https://gradeforge.tech/settings`

---

## University administrator

### Open the admin workspace (defaults to faculty section)

**Role:** University admin

1. Sign in; you land in the university shell.

**Path:** `/university-admin` (redirects to faculty subsection)  
**Example URL:** `https://gradeforge.tech/university-admin/faculty`  
**More detail:** [University administration](../features/university-administration)

### Manage faculty records

**Path:** `/university-admin/faculty`  
**Example URL:** `https://gradeforge.tech/university-admin/faculty`

### Manage semesters

**Path:** `/university-admin/semesters`  
**Example URL:** `https://gradeforge.tech/university-admin/semesters`

### Manage courses (institution)

**Path:** `/university-admin/courses`  
**Example URL:** `https://gradeforge.tech/university-admin/courses`

### Manage programming languages

**Path:** `/university-admin/languages`  
**Example URL:** `https://gradeforge.tech/university-admin/languages`

### Manage users

**Path:** `/university-admin/manage-users`  
**Example URL:** `https://gradeforge.tech/university-admin/manage-users`

### Monitor activity

**Path:** `/university-admin/monitor`  
**Example URL:** `https://gradeforge.tech/university-admin/monitor`

### Admin profile and settings

**Path:** `/university-admin/settings`  
**Example URL:** `https://gradeforge.tech/university-admin/settings`

---

## Note on `/faculty/grading`

That path **redirects** to **My classes**. Use class-scoped assignment and grading routes above.

**Path:** `/faculty/grading`  
**Example URL:** `https://gradeforge.tech/faculty/grading` (you end up on `/faculty/my-classes`)
