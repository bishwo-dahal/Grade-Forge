# All actions by role

Every entry lists **steps**, **Path**, an **example URL** when it helps, and a **screenshot** when one is available. Example host and ids are samples. See [URLs in this manual](../conventions).

**More detail** links go to topic pages under [Features](../features/sign-in-and-account).

![All actions index in the documentation site](/manual/images/manual-actions.png)

---

## Everyone (before sign-in)

### Create an account

![Create an account page](</manual/images/create an account- anyone.png>)

**Role:** Anyone (if your school allows self sign-up)

1. Open **Sign up**.
2. Complete the form and submit.

**Path:** `/signup`  
**Example URL:** [https://ulm.gradeforge.tech/signup](https://ulm.gradeforge.tech/signup)  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

### Sign in

![Sign-in page](</manual/images/sign in anyone.png>)

**Role:** Anyone with an account

1. Open **Sign in**.
2. Enter email and password (or your school’s method).

**Path:** `/signin`  
**Example URL:** [https://ulm.gradeforge.tech/signin](https://ulm.gradeforge.tech/signin)  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

---

## Student

### Finish first-time registration (if required)

![Complete registration page for a student](</manual/images/Complete registration-student.png>)

**Role:** Student

1. After sign-in, if prompted, open **Complete registration**.
2. Fill required fields and save.

**Path:** `/complete-registration`  
**Example URL:** [https://ulm.gradeforge.tech/complete-registration](https://ulm.gradeforge.tech/complete-registration)  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

### Open the student dashboard

![Student dashboard](/manual/images/dashboard-student.png)

**Role:** Student

1. Sign in as a student.
2. You land on **Dashboard**, or open it from the sidebar.

**Path:** `/dashboard`  
**Example URL:** [https://ulm.gradeforge.tech/dashboard](https://ulm.gradeforge.tech/dashboard)

### Change profile, password, notifications, or appearance

![Student profile and settings](</manual/images/change profile- student.png>)

**Role:** Student

1. Open **Settings** in the sidebar.
2. Pick a section (profile, security, notifications, appearance) and save changes.

**Path:** `/settings`  
**Example URL:** [https://ulm.gradeforge.tech/settings](https://ulm.gradeforge.tech/settings)  
**More detail:** [Sign-in and account](../features/sign-in-and-account)

### View enrolled courses

![Student list of enrolled courses](</manual/images/view enrolled courses- student.png>)

**Role:** Student

1. Open **My courses** in the sidebar.

**Path:** `/student/my-courses`  
**Example URL:** [https://ulm.gradeforge.tech/student/my-courses](https://ulm.gradeforge.tech/student/my-courses)  
**More detail:** [Courses and classes](../features/courses-and-classes)

### Open a course

![Student course view](</manual/images/open course- student.png>)

**Role:** Student

1. From **My courses**, select a course.

**Path:** `/course/{courseId}`  
**Example URL:** [https://ulm.gradeforge.tech/course/3](https://ulm.gradeforge.tech/course/3)

### Open a class section

![Student class section view](</manual/images/open a class section- student.png>)

**Role:** Student

1. From the course view, open a class (section).

**Path:** `/class/{classId}`  
**Example URL:** [https://ulm.gradeforge.tech/class/4](https://ulm.gradeforge.tech/class/4)

### View all assignments in one list

![Student assignments list](</manual/images/View all assignments in one list- student.png>)

**Role:** Student

1. Open **Assignments** in the sidebar.

**Path:** `/student/assignments`  
**Example URL:** [https://ulm.gradeforge.tech/student/assignments](https://ulm.gradeforge.tech/student/assignments)

### Open an assignment workspace

![Student assignment workspace](</manual/images/Open an assignment workspace- student.png>)

**Role:** Student

1. From **Assignments**, the class page, or a link from your instructor, open an assignment.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Assignments and editor](../features/assignments-and-editor)

### Read assignment instructions

![Assignment description tab for a student](</manual/images/Read assignment instructions- student.png>)

**Role:** Student

1. On the assignment, open the **Description** tab.

**Path:** `/assignment/{assignmentId}` (Description tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)

### Run tests using your current editor files

![Running tests with current editor files](</manual/images/Run tests using your current editor files- student.png>)

**Role:** Student

1. Open the assignment **Tests** tab.
2. Add or edit files in the editor (or upload if the UI offers it).
3. Choose **Run tests** (wording may be **Run** or similar).

**Path:** `/assignment/{assignmentId}` (Tests tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### Run tests with custom standard input (when allowed)

![Running tests with custom stdin](</manual/images/Run tests with custom standard input (when allowed)- student.png>)

**Role:** Student

1. Open the **Tests** tab.
2. If **custom stdin** is shown, enter the input text.
3. Run tests as above.

**Path:** `/assignment/{assignmentId}` (Tests tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### Run tests against your latest submission

![Running tests against the latest submission](</manual/images/Run tests against your latest submission- student.png>)

**Role:** Student (after at least one submission exists)

1. Open the **Tests** tab.
2. Run tests using the control that targets the **latest submission** (no new files required in the editor).

**Path:** `/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### View the rubric (read-only)

![Read-only rubric view for a student](</manual/images/View the rubric (read-only)- student.png>)

**Role:** Student

1. Open the **Rubric** tab on the assignment.

**Path:** `/assignment/{assignmentId}` (Rubric tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### View your group for a group assignment

**Role:** Student

1. Open the **Group** tab on the assignment.

**Path:** `/assignment/{assignmentId}` (Group tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### Submit the assignment

![Submitting an assignment](</manual/images/Submit the assignment- student.png>)

**Role:** Student

1. Add code in the editor or upload an allowed source file (the page will say what is missing if you cannot submit).
2. Use **Submit** and confirm in the dialog.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Tests and submissions](../features/tests-and-submissions)

### See results, test output, and instructor feedback or grades

**Role:** Student

1. Open the assignment.
2. Use the **Results** tab (and related areas) for submission status, test runs, and any grades or feedback your instructor released.

**Path:** `/assignment/{assignmentId}` (Results tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)  
**More detail:** [Grading and feedback](../features/grading-and-feedback)

### Open calendar, materials, or discussions

![Student calendar, materials, and discussions](</manual/images/Open calendar, materials, or discussions- student.png>)

**Role:** Student

1. Use **Calendar**, **Materials**, or **Discussions** in the sidebar.

**Path:** `/student/calendar`, `/student/materials`, `/student/discussions`  
**Example URL:** [https://ulm.gradeforge.tech/student/calendar](https://ulm.gradeforge.tech/student/calendar)  
**More detail:** [Calendar, materials, discussions](../features/calendar-materials-discussions)

---

## Faculty

### Open the faculty dashboard

![Faculty dashboard](</manual/images/Open the faculty dashboard- faculty.png>)

**Role:** Faculty

1. Sign in and use **Dashboard** from the sidebar.

**Path:** `/dashboard`  
**Example URL:** [https://ulm.gradeforge.tech/dashboard](https://ulm.gradeforge.tech/dashboard)

### Change profile, password, notifications, or appearance

![Faculty profile and settings](</manual/images/Change profile, password, notifications, or appearance- faculty.png>)

**Role:** Faculty

1. Open **Settings** in the sidebar.

**Path:** `/settings`  
**Example URL:** [https://ulm.gradeforge.tech/settings](https://ulm.gradeforge.tech/settings)

### List your classes

![Faculty list of classes](</manual/images/List your classes- faculty.png>)

**Role:** Faculty

1. Open **My classes**.

**Path:** `/faculty/my-classes`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/my-classes](https://ulm.gradeforge.tech/faculty/my-classes)  
**More detail:** [Courses and classes](../features/courses-and-classes)

### Create a new class

![Create a new class as faculty](</manual/images/Create a new class- faculty.png>)

**Role:** Faculty

1. Open **My classes** then **Create** (or the create class action).

**Path:** `/faculty/my-classes/create`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/my-classes/create](https://ulm.gradeforge.tech/faculty/my-classes/create)

### Open a class section (dashboard, roster, assignments, …)

![Faculty class section view](</manual/images/Open a class section (dashboard, roster, assignments, …)- faculty.png>)

**Role:** Faculty

1. From **My classes**, open a class. Sections use paths like `dashboard`, `assignments`, `students`, `grades`, `groups` after the class id.

**Path:** `/faculty/class/{classId}/{section}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/dashboard](https://ulm.gradeforge.tech/faculty/class/4/dashboard)

### Create an assignment in a class

![Create an assignment in a class](</manual/images/Create an assignment in a class- faculty.png>)

**Role:** Faculty

1. Open the class, go to **Assignments**, start **Create assignment**.

**Path:** `/faculty/class/{classId}/assignments/create`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignments/create](https://ulm.gradeforge.tech/faculty/class/4/assignments/create)  
**More detail:** [Assignments and editor](../features/assignments-and-editor)

### Edit an existing assignment

![Edit an existing assignment](</manual/images/Edit an existing assignment- faculty.png>)

**Role:** Faculty

1. From the class assignments list, choose **Edit** for an assignment.

**Path:** `/faculty/class/{classId}/assignments/{assignmentId}/edit`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignments/12/edit](https://ulm.gradeforge.tech/faculty/class/4/assignments/12/edit)

### Open an assignment in management context (from class flow)

![Assignment in management context](</manual/images/Open an assignment in management context (from class flow)- faculty.png>)

**Role:** Faculty

1. Use the assignment link from the class **Assignments** tab or equivalent.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignment/12](https://ulm.gradeforge.tech/faculty/class/4/assignment/12)  
**More detail:** [Assignments and editor](../features/assignments-and-editor)

### Open an assignment by id (shortcut route)

![Assignment opened by id shortcut](</manual/images/Open an assignment by id (shortcut route)- faculty.png>)

**Role:** Faculty

1. Navigate to `/faculty/assignment/{assignmentId}` when you have a direct link.

**Path:** `/faculty/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/assignment/12](https://ulm.gradeforge.tech/faculty/assignment/12)

### Open a specific submission from an assignment shortcut

**Role:** Faculty

1. Use a link that includes `submission` in the path.

**Path:** `/faculty/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/assignment/12/submission/99](https://ulm.gradeforge.tech/faculty/assignment/12/submission/99)

### Grade one submission (full grading workspace)

![Full grading workspace for faculty](</manual/images/Grade one submission (full grading workspace)- faculty.png>)

**Role:** Faculty

1. From the class assignment view or submission list, open a submission.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99)  
**More detail:** [Grading and feedback](../features/grading-and-feedback)

### Use speed grading for one assignment

![Speed grading for one assignment](</manual/images/Use speed grading for one assignment- faculty.png>)

**Role:** Faculty

1. From the class, open **Speed grading** for the assignment (wording may vary).

**Path:** `/faculty/class/{classId}/speed-grading/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/speed-grading/12](https://ulm.gradeforge.tech/faculty/class/4/speed-grading/12)

### Open student detail inside a class

![Student detail inside a class](</manual/images/Open student detail inside a class- faculty.png>)

**Role:** Faculty

1. From the class **Students** area, open a student.

**Path:** `/faculty/class/{classId}/students/{studentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/students/7](https://ulm.gradeforge.tech/faculty/class/4/students/7)

### Open main group detail

![Main group detail view](</manual/images/Open main group detail- faculty.png>)

**Role:** Faculty

1. From class **Groups**, open a main group.

**Path:** `/faculty/class/{classId}/groups/{mainGroupId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/groups/2](https://ulm.gradeforge.tech/faculty/class/4/groups/2)  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### Alternate grading route (legacy path)

**Role:** Faculty

1. Some links use `/assignment/{assignmentId}/grade/{submissionId}`.

**Path:** `/assignment/{assignmentId}/grade/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12/grade/99](https://ulm.gradeforge.tech/assignment/12/grade/99)

### List and manage rubrics

**Role:** Faculty

1. Open **Rubrics** in the sidebar.

**Path:** `/faculty/rubrics`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/rubrics](https://ulm.gradeforge.tech/faculty/rubrics)  
**More detail:** [Rubrics and groups](../features/rubrics-and-groups)

### Create a rubric

![Create a rubric as faculty](</manual/images/Create a rubric- faculty.png>)

**Role:** Faculty

1. From **Rubrics**, start **New**.

**Path:** `/faculty/rubrics/new`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/rubrics/new](https://ulm.gradeforge.tech/faculty/rubrics/new)

### Edit or view one rubric

![Edit or view a single rubric](</manual/images/Edit or view one rubric- faculty.png>)

**Role:** Faculty

1. Open a rubric from the list.

**Path:** `/faculty/rubrics/{rubricId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/rubrics/5](https://ulm.gradeforge.tech/faculty/rubrics/5)

### Manage grading assistants

![Manage grading assistants](</manual/images/Manage grading assistants- faculty.png>)

**Role:** Faculty

1. Open **Grading assistants** in the sidebar.

**Path:** `/faculty/grading-assistants`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/grading-assistants](https://ulm.gradeforge.tech/faculty/grading-assistants)  
**More detail:** [Grading assistants](../features/grading-assistants)

### Faculty student search or roster tools

![Faculty student search and roster tools](</manual/images/Faculty student search or roster tools- faculty.png>)

**Role:** Faculty

1. Open **Students** in the sidebar.

**Path:** `/faculty/students`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/students](https://ulm.gradeforge.tech/faculty/students)

### Schedule, materials, discussions

**Role:** Faculty

1. Use **Schedule**, **Materials**, or **Discussions** in the sidebar.

**Path:** `/faculty/schedule`, `/faculty/materials`, `/faculty/discussions`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/schedule](https://ulm.gradeforge.tech/faculty/schedule)  
**More detail:** [Calendar, materials, discussions](../features/calendar-materials-discussions)

### Run Plagiarism and AI analysis for an assignment (faculty)

![Plagiarism and AI analysis tab](</manual/images/Run Plagiarism and AI analysis for an assignment (faculty).png>)

**Role:** Faculty

1. Open a submission in the grading workspace.
2. Open the **Plagiarism and AI** tab.
3. Use **Run** when shown and wait for the job to finish.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}/submission/{submissionId}` (Plagiarism tab)  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99)  
**More detail:** [Plagiarism and AI reports](../features/plagiarism-and-ai-reports)

### Download all submission files for an assignment (faculty)

![Download all submission files as a ZIP](</manual/images/Download all submission files for an assignment (faculty).png>)

**Role:** Faculty

1. Open the assignment (submissions list).
2. In the **Submissions** header, use the **Download** icon to download a ZIP.

The ZIP contains one folder per student with their submitted files.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignment/12](https://ulm.gradeforge.tech/faculty/class/4/assignment/12)

---

## Grading assistant

### List courses you assist

![Grading assistant list of assisted courses](</manual/images/List courses you assist- Grading assistant.png>)

**Role:** Grading assistant

1. Open **Courses** in the sidebar (grading assistant shell).

**Path:** `/grading-assistant/courses`  
**Example URL:** [https://ulm.gradeforge.tech/grading-assistant/courses](https://ulm.gradeforge.tech/grading-assistant/courses)  
**More detail:** [Grading assistants](../features/grading-assistants)

### Open a class as a GA

![Grading assistant class view](</manual/images/Open a class as a GA- Grading assistant.png>)

**Role:** Grading assistant

1. From **Courses**, select a class.

**Path:** `/grading-assistant/class/{classId}`  
**Example URL:** [https://ulm.gradeforge.tech/grading-assistant/class/4](https://ulm.gradeforge.tech/grading-assistant/class/4)

### Open an assignment in that class

![Grading assistant assignment view](</manual/images/Open an assignment in that class- Grading assistant.png>)

**Role:** Grading assistant

1. From the class view, open an assignment.

**Path:** `/grading-assistant/class/{classId}/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12](https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12)

### Grade a submission

![Grading a submission as grading assistant](</manual/images/Grade a submission- Grading assistant.png>)

**Role:** Grading assistant

1. Open a submission from the assignment view.

**Path:** `/grading-assistant/class/{classId}/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99)  
**More detail:** [Grading and feedback](../features/grading-and-feedback)

### Change GA account settings

![Grading assistant account settings](</manual/images/Change GA account settings- Grading assistant.png>)

**Role:** Grading assistant

1. Open **Settings** in the sidebar.

**Path:** `/settings`  
**Example URL:** [https://ulm.gradeforge.tech/settings](https://ulm.gradeforge.tech/settings)

---

## University administrator

### Open the admin workspace (defaults to faculty section)

![Admin workspace defaulting to faculty](</manual/images/Open the admin workspace (defaults to faculty section)- University admin.png>)

**Role:** University admin

1. Sign in; you land in the university shell.

**Path:** `/university-admin` (redirects to faculty subsection)  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/faculty](https://ulm.gradeforge.tech/university-admin/faculty)  
**More detail:** [University administration](../features/university-administration)

### Manage faculty records

![Manage faculty records](</manual/images/Manage faculty records- University admin.png>)

**Path:** `/university-admin/faculty`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/faculty](https://ulm.gradeforge.tech/university-admin/faculty)

### Manage semesters

![Manage semesters](</manual/images/Manage semesters- University admin.png>)

**Path:** `/university-admin/semesters`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/semesters](https://ulm.gradeforge.tech/university-admin/semesters)

### Manage courses (institution)

![Manage institution courses](</manual/images/Manage courses (institution)- University admin.png>)

**Path:** `/university-admin/courses`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/courses](https://ulm.gradeforge.tech/university-admin/courses)

### Manage programming languages

![Manage programming languages](</manual/images/Manage programming languages- University admin.png>)

**Path:** `/university-admin/languages`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/languages](https://ulm.gradeforge.tech/university-admin/languages)

### Manage users

![Manage users](</manual/images/Manage users- University admin.png>)

**Path:** `/university-admin/manage-users`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/manage-users](https://ulm.gradeforge.tech/university-admin/manage-users)

### Monitor activity

![Monitor institution activity](</manual/images/Monitor activity- University admin.png>)

**Path:** `/university-admin/monitor`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/monitor](https://ulm.gradeforge.tech/university-admin/monitor)

### Admin profile and settings

![University admin profile and settings](</manual/images/Admin profile and settings- University admin.png>)

**Path:** `/university-admin/settings`  
**Example URL:** [https://ulm.gradeforge.tech/university-admin/settings](https://ulm.gradeforge.tech/university-admin/settings)

---

## Note on `/faculty/grading`

That path **redirects** to **My classes**. Use class-scoped assignment and grading routes above.

**Path:** `/faculty/grading`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/grading](https://ulm.gradeforge.tech/faculty/grading) (you end up on `/faculty/my-classes`)
