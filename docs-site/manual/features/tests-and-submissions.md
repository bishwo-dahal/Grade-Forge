# Tests and submissions

## How do I run tests on my draft code (student)?

1. Open the assignment **Tests** tab.
2. Enter code in the editor or upload allowed files if the UI shows upload.
3. Press **Run tests** (or the equivalent button).

**Path:** `/assignment/{assignmentId}` (Tests tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`

## How do I run tests with custom input (stdin)?

1. Open the **Tests** tab.
2. If a **custom stdin** or **standard input** field appears, type the input the assignment expects.
3. Run tests.

**Path:** `/assignment/{assignmentId}` (Tests tab)  
**Example URL:** `https://gradeforge.tech/assignment/12`

## Why does the app say I need a file or code before submitting?

You must either upload an allowed source file (for example `.py` or `.java` when required) or keep non-empty code in the editor, depending on the assignment rules. The message names what is missing.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`

## How do I submit?

1. Satisfy the file or editor rules.
2. Click **Submit** and confirm in the dialog.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`

## How do I run tests after I already submitted?

1. Open the **Tests** tab.
2. Use the action that runs against your **latest submission** when it appears.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** `https://gradeforge.tech/assignment/12`

## How long do tests take?

Runs can take seconds or longer. The page usually shows **running** or a spinner, then results. If a run fails with a timeout or server error, try again or contact your instructor.

## Faculty or GA running tests while grading

1. Open the submission in the grading workspace.
2. Use **Tests** there to run against the student files or ad-hoc files when the UI allows.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}/submission/{submissionId}` (Tests tab)  
**Example URL:** `https://gradeforge.tech/faculty/class/4/assignment/12/submission/99`
