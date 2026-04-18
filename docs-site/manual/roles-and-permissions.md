# Who can do what

This table is written for readers, not developers. Cells use **Yes**, **No**, or a short condition. **Path** and **Example URL** help you jump to the right screen.

Example URLs use `https://gradeforge.tech`; numeric ids in paths are samples only.

| Action | Student | Faculty | Grading assistant | University admin | Path | Example URL |
| ------ | ------- | ------- | ----------------- | ---------------- | ---- | ----------- |
| Sign up | Yes | Yes | Yes | Yes | `/signup` | `https://gradeforge.tech/signup` |
| Sign in | Yes | Yes | Yes | Yes | `/signin` | `https://gradeforge.tech/signin` |
| Student first-time registration | Yes | No | No | No | `/complete-registration` | …/complete-registration |
| Student / faculty / GA settings | Yes | Yes | Yes | No (use admin settings) | `/settings` | …/settings |
| University admin settings | No | No | No | Yes | `/university-admin/settings` | …/university-admin/settings |
| Student dashboard | Yes | No | No | No | `/dashboard` | …/dashboard |
| Faculty or GA dashboard | No | Yes | Yes | No | `/dashboard` | …/dashboard |
| My courses (student) | Yes | No | No | No | `/student/my-courses` | …/student/my-courses |
| Course page (student) | Yes | No | No | No | `/course/{courseId}` | …/course/3 |
| Class page (student) | Yes | No | No | No | `/class/{classId}` | …/class/4 |
| Student assignments list | Yes | No | No | No | `/student/assignments` | …/student/assignments |
| Student assignment workspace | Yes | No | No | No | `/assignment/{assignmentId}` | …/assignment/12 |
| Submit and run tests (student) | Yes | No | No | No | `/assignment/{assignmentId}` | …/assignment/12 |
| Faculty my classes | No | Yes | No | No | `/faculty/my-classes` | …/faculty/my-classes |
| Create class | No | Yes | No | No | `/faculty/my-classes/create` | …/faculty/my-classes/create |
| Create or edit assignment | No | Yes | No | No | `/faculty/class/{classId}/assignments/...` | …/faculty/class/4/assignments/create |
| Faculty class shell | No | Yes | No | No | `/faculty/class/{classId}/{section}` | …/faculty/class/4/dashboard |
| Grade submission | No | Yes | Yes (if assigned) | No | `/faculty/class/.../submission/...` or GA path | see [Actions](./actions/) |
| Speed grading | No | Yes | No | No | `/faculty/class/{classId}/speed-grading/{assignmentId}` | …/speed-grading/12 |
| Rubrics CRUD | No | Yes | No | No | `/faculty/rubrics` | …/faculty/rubrics |
| Manage grading assistants | No | Yes | No | No | `/faculty/grading-assistants` | …/faculty/grading-assistants |
| Faculty students tools | No | Yes | No | No | `/faculty/students` | …/faculty/students |
| Run Plagiarism and AI report | No | Yes | View when present | No | Grading workspace tab | …/submission/99 |
| GA courses list | No | No | Yes | No | `/grading-assistant/courses` | …/grading-assistant/courses |
| GA grade submission | No | No | Yes | No | `/grading-assistant/class/.../submission/...` | …/submission/99 |
| Manage faculty (institution) | No | No | No | Yes | `/university-admin/faculty` | …/university-admin/faculty |
| Manage semesters | No | No | No | Yes | `/university-admin/semesters` | …/university-admin/semesters |
| Manage courses (institution) | No | No | No | Yes | `/university-admin/courses` | …/university-admin/courses |
| Manage languages | No | No | No | Yes | `/university-admin/languages` | …/university-admin/languages |
| Manage users | No | No | No | Yes | `/university-admin/manage-users` | …/university-admin/manage-users |
| Monitor | No | No | No | Yes | `/university-admin/monitor` | …/university-admin/monitor |

**Note:** The API layer can allow some overlap (for example certain student endpoints for elevated roles). The table reflects the **primary** app experience for each role. If a button is missing for you, your account role or school policy is the usual reason.

**More detail:** [All actions](./actions/)
