# Courses and classes

## How does a student open a course?

1. Sign in as a student.
2. Open **My courses**.
3. Select a course card or row.

**Path:** `/student/my-courses` then `/course/{courseId}`  
**Example URL:** `https://gradeforge.tech/course/3`

## How does a student open a class section?

1. From the course view, choose a class (section) your instructor uses.

**Path:** `/class/{classId}`  
**Example URL:** `https://gradeforge.tech/class/4`

## How does a faculty member list classes?

1. Open **My classes**.

**Path:** `/faculty/my-classes`  
**Example URL:** `https://gradeforge.tech/faculty/my-classes`

## How does a faculty member create a class?

1. From **My classes**, start **Create class** (wording may match your UI).

**Path:** `/faculty/my-classes/create`  
**Example URL:** `https://gradeforge.tech/faculty/my-classes/create`

## How does a faculty member open the class management shell?

1. From **My classes**, open a class. Use sections such as **dashboard**, **assignments**, **students**, **grades**, **groups** in the URL or tabs.

**Path:** `/faculty/class/{classId}/{section}`  
**Example URL:** `https://gradeforge.tech/faculty/class/4/dashboard`

## How does a grading assistant open a class?

1. Open **Courses**, then pick a class.

**Path:** `/grading-assistant/class/{classId}`  
**Example URL:** `https://gradeforge.tech/grading-assistant/class/4`

## How do university admins manage courses at the institution?

1. Open **Courses** in the university admin sidebar.

**Path:** `/university-admin/courses`  
**Example URL:** `https://gradeforge.tech/university-admin/courses`
