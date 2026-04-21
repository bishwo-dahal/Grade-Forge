# Who can do what

This table is written for readers, not developers. Cells use **Yes**, **No**, or a short condition. **Path** and **Example URL** help you jump to the right screen.

Example URLs use the ULM deployment [https://ulm.gradeforge.tech](https://ulm.gradeforge.tech); numeric ids in paths are samples only.

| Action | Student | Faculty | Grading assistant | University admin | Path | Example URL |
| ------ | ------- | ------- | ----------------- | ---------------- | ---- | ----------- |
| Sign up | Yes | Yes | Yes | Yes | `/signup` | [https://ulm.gradeforge.tech/signup](https://ulm.gradeforge.tech/signup) |
| Sign in | Yes | Yes | Yes | Yes | `/signin` | [https://ulm.gradeforge.tech/signin](https://ulm.gradeforge.tech/signin) |
| Student first-time registration | Yes | No | No | No | `/complete-registration` | [https://ulm.gradeforge.tech/complete-registration](https://ulm.gradeforge.tech/complete-registration) |
| Student / faculty / GA settings | Yes | Yes | Yes | No (use admin settings) | `/settings` | [https://ulm.gradeforge.tech/settings](https://ulm.gradeforge.tech/settings) |
| University admin settings | No | No | No | Yes | `/university-admin/settings` | [https://ulm.gradeforge.tech/university-admin/settings](https://ulm.gradeforge.tech/university-admin/settings) |
| Student dashboard | Yes | No | No | No | `/dashboard` | [https://ulm.gradeforge.tech/dashboard](https://ulm.gradeforge.tech/dashboard) |
| Faculty or GA dashboard | No | Yes | Yes | No | `/dashboard` | [https://ulm.gradeforge.tech/dashboard](https://ulm.gradeforge.tech/dashboard) |
| My courses (student) | Yes | No | No | No | `/student/my-courses` | [https://ulm.gradeforge.tech/student/my-courses](https://ulm.gradeforge.tech/student/my-courses) |
| Course page (student) | Yes | No | No | No | `/course/{courseId}` | [https://ulm.gradeforge.tech/course/3](https://ulm.gradeforge.tech/course/3) |
| Class page (student) | Yes | No | No | No | `/class/{classId}` | [https://ulm.gradeforge.tech/class/4](https://ulm.gradeforge.tech/class/4) |
| Student assignments list | Yes | No | No | No | `/student/assignments` | [https://ulm.gradeforge.tech/student/assignments](https://ulm.gradeforge.tech/student/assignments) |
| Student assignment workspace | Yes | No | No | No | `/assignment/{assignmentId}` | [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12) |
| Submit and run tests (student) | Yes | No | No | No | `/assignment/{assignmentId}` | [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12) |
| Faculty my classes | No | Yes | No | No | `/faculty/my-classes` | [https://ulm.gradeforge.tech/faculty/my-classes](https://ulm.gradeforge.tech/faculty/my-classes) |
| Create class | No | Yes | No | No | `/faculty/my-classes/create` | [https://ulm.gradeforge.tech/faculty/my-classes/create](https://ulm.gradeforge.tech/faculty/my-classes/create) |
| Create or edit assignment | No | Yes | No | No | `/faculty/class/{classId}/assignments/...` | [https://ulm.gradeforge.tech/faculty/class/4/assignments/create](https://ulm.gradeforge.tech/faculty/class/4/assignments/create) |
| Faculty class shell | No | Yes | No | No | `/faculty/class/{classId}/{section}` | [https://ulm.gradeforge.tech/faculty/class/4/dashboard](https://ulm.gradeforge.tech/faculty/class/4/dashboard) |
| Grade submission | No | Yes | Yes (if assigned) | No | `/faculty/class/.../submission/...` or GA path | [faculty example](https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99) · [GA example](https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99) · [all actions](./actions/) |
| Speed grading | No | Yes | No | No | `/faculty/class/{classId}/speed-grading/{assignmentId}` | [https://ulm.gradeforge.tech/faculty/class/4/speed-grading/12](https://ulm.gradeforge.tech/faculty/class/4/speed-grading/12) |
| Rubrics CRUD | No | Yes | No | No | `/faculty/rubrics` | [https://ulm.gradeforge.tech/faculty/rubrics](https://ulm.gradeforge.tech/faculty/rubrics) |
| Manage grading assistants | No | Yes | No | No | `/faculty/grading-assistants` | [https://ulm.gradeforge.tech/faculty/grading-assistants](https://ulm.gradeforge.tech/faculty/grading-assistants) |
| Faculty students tools | No | Yes | No | No | `/faculty/students` | [https://ulm.gradeforge.tech/faculty/students](https://ulm.gradeforge.tech/faculty/students) |
| Run Plagiarism and AI report | No | Yes | View when present | No | Grading workspace tab | [https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99) |
| GA courses list | No | No | Yes | No | `/grading-assistant/courses` | [https://ulm.gradeforge.tech/grading-assistant/courses](https://ulm.gradeforge.tech/grading-assistant/courses) |
| GA grade submission | No | No | Yes | No | `/grading-assistant/class/.../submission/...` | [https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99) |
| Manage faculty (institution) | No | No | No | Yes | `/university-admin/faculty` | [https://ulm.gradeforge.tech/university-admin/faculty](https://ulm.gradeforge.tech/university-admin/faculty) |
| Manage semesters | No | No | No | Yes | `/university-admin/semesters` | [https://ulm.gradeforge.tech/university-admin/semesters](https://ulm.gradeforge.tech/university-admin/semesters) |
| Manage courses (institution) | No | No | No | Yes | `/university-admin/courses` | [https://ulm.gradeforge.tech/university-admin/courses](https://ulm.gradeforge.tech/university-admin/courses) |
| Manage languages | No | No | No | Yes | `/university-admin/languages` | [https://ulm.gradeforge.tech/university-admin/languages](https://ulm.gradeforge.tech/university-admin/languages) |
| Manage users | No | No | No | Yes | `/university-admin/manage-users` | [https://ulm.gradeforge.tech/university-admin/manage-users](https://ulm.gradeforge.tech/university-admin/manage-users) |
| Monitor | No | No | No | Yes | `/university-admin/monitor` | [https://ulm.gradeforge.tech/university-admin/monitor](https://ulm.gradeforge.tech/university-admin/monitor) |

**Note:** The API layer can allow some overlap (for example certain student endpoints for elevated roles). The table reflects the **primary** app experience for each role. If a button is missing for you, your account role or school policy is the usual reason.

**More detail:** [All actions](./actions/)
