# Assignments and editor

## How does a student open an assignment?

1. Use **Assignments** in the sidebar, or open one from a class, or follow an instructor link.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)

## What are the tabs on the assignment page?

Typical tabs (labels may vary slightly):

- **Description** … instructions and rules.
- **Tests** … run automated checks.
- **Rubric** … how you are graded (read-only for students).
- **Group** … teammates when the assignment uses groups.
- **Results** … submissions, runs, and feedback or grades when released.

**Path:** `/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)

## How does a faculty member create an assignment?

1. Open the class, go to **Assignments**, choose **Create**.
2. Fill title, language, rubric, tests, dates, and group options as your school requires.
3. Save or publish per your workflow.

**Path:** `/faculty/class/{classId}/assignments/create`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignments/create](https://ulm.gradeforge.tech/faculty/class/4/assignments/create)

## How does a faculty member edit an assignment?

1. From the class **Assignments** list, choose **Edit** on a row.

**Path:** `/faculty/class/{classId}/assignments/{assignmentId}/edit`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignments/12/edit](https://ulm.gradeforge.tech/faculty/class/4/assignments/12/edit)

## How does a faculty member open assignment management from the class?

1. From **Assignments** inside the class, open the assignment row.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignment/12](https://ulm.gradeforge.tech/faculty/class/4/assignment/12)

## How does a faculty member use the shortcut assignment URL?

1. When you have a direct link with only the assignment id, use:

**Path:** `/faculty/assignment/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/assignment/12](https://ulm.gradeforge.tech/faculty/assignment/12)

## Editor and files

Students and faculty may see a **file tree** and **tabs** for multiple files. Save work in the editor before **Run tests** or **Submit** if the page does not auto-save everything you expect.

**Path:** Same assignment path as above.  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)
