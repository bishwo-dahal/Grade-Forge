# URLs in this manual

Paths match the Grade-Forge web app after you sign in. For the **University of Louisiana Monroe** deployment, your address bar looks like:

**[https://ulm.gradeforge.tech](https://ulm.gradeforge.tech)** + path (for example `/assignment/12`).

If your school runs a different host, swap the origin; the path part stays the same.

**Example URLs** in this manual use **[https://ulm.gradeforge.tech](https://ulm.gradeforge.tech)** plus sample numbers such as `4` or `12`. Those numbers are placeholders: use the course, class, assignment, and submission ids from your own account.

We never use `localhost` here. The same paths work in production and in local development; only the origin changes.

**Path:** always shown for in-app tasks (placeholders in `{curlyBraces}` mean “your id here”).

**Example URL:** shown when a full link makes the page easier to read. Whenever you see **`Example URL:`**, the value is a **markdown link** (`[https://…](https://…)`) so you can open it directly in the browser (sample ids such as `4` or `12` are placeholders).

## System Workflow Breakdown

Grade-Forge is built to streamline the entire assignment lifecycle:

1. **Course Setup:** Faculty members set up courses, enroll students, and define grading rubrics.
2. **Assignment Distribution:** Coding tasks and materials are distributed to students or student groups.
3. **Student Submission:** Students write their code, either locally or via the integrated editor, and submit it directly to the platform.
4. **Automated Evaluation:** Submissions are automatically run against predefined test cases in secure environments, generating immediate pass/fail reports and execution metrics.
5. **Grading & Feedback:** Grading assistants review the automated results, check AI-generated plagiarism reports, and provide manual feedback where necessary.
6. **Final Review:** Faculty oversee the process, adjust grades if needed, and publish the final results to students.

This integrated approach ensures a fast, reliable, and transparent grading process for everyone involved.
