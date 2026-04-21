# Grading and feedback

## Where do I see grades or feedback as a student?

1. Open the same **assignment** you submitted.
2. Open the **Results** tab (and any related panels your instructor uses).
3. If nothing appears yet, the instructor may not have graded or released feedback.

**Path:** `/assignment/{assignmentId}` (Results tab)  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12](https://ulm.gradeforge.tech/assignment/12)

## How does a faculty member open one submission to grade?

1. From the class, open the **assignment**, then choose a student or submission row.

**Path:** `/faculty/class/{classId}/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/faculty/class/4/assignment/12/submission/99)

## How does speed grading work?

1. From the class, open **Speed grading** for a given assignment.
2. Move through the queue the UI provides.

**Path:** `/faculty/class/{classId}/speed-grading/{assignmentId}`  
**Example URL:** [https://ulm.gradeforge.tech/faculty/class/4/speed-grading/12](https://ulm.gradeforge.tech/faculty/class/4/speed-grading/12)

## How does a grading assistant grade?

1. Open **Courses**, **Class**, **Assignment**, then a **submission**. The layout matches faculty grading in most places.

**Path:** `/grading-assistant/class/{classId}/assignment/{assignmentId}/submission/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99](https://ulm.gradeforge.tech/grading-assistant/class/4/assignment/12/submission/99)

## Alternate faculty URL (some bookmarks)

**Path:** `/assignment/{assignmentId}/grade/{submissionId}`  
**Example URL:** [https://ulm.gradeforge.tech/assignment/12/grade/99](https://ulm.gradeforge.tech/assignment/12/grade/99)

## Rubric scoring

Use the **Rubric** tab in the grading workspace to enter per-criterion scores and feedback your template defines.

**Path:** Same submission grading path as above.
