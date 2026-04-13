# Typical lifecycle (plain language)

This is a common flow. Your school may vary steps.

1. **University admin** creates **semesters**, **courses**, and **faculty** assignments, and sets **programming languages** the institution allows.
2. **Faculty** open **classes** from their courses, manage **enrollment** (or students self-enroll if your school allows it), and set up **groups** when assignments are group-based.
3. **Faculty** create **assignments** (description, due rules, language, **rubric**, **test suite** if used, group settings).
4. **Students** open the **assignment**, read the **description**, write or upload code, **run tests** before or after submit, then **submit**.
5. The system may **queue test runs** or other jobs; students see **results** on the assignment when available.
6. **Faculty** or **grading assistants** open a **submission**, review code, **run tests** again if needed, fill the **rubric** and feedback, and save grades.
7. **Faculty** may run **Plagiarism and AI** style reports for an assignment (async). Results appear on the grading view when ready.
8. **Students** return to the same **assignment** to see status, test output, and **feedback or grades** your instructor chose to expose (usually under **Results** or the grading tab area).

**Path (student assignment hub):** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`
