# Group API

Endpoints for the Course → MainGroup → SubGroup hierarchy and student membership.

## Roles and base paths
- Faculty manage groups under `/api/v1/faculty/courses/{courseId}/groups`
- Students read group hierarchy under `/api/v1/student/courses/{courseId}/groups`

## Faculty endpoints
### Create a main group
- `POST /api/v1/faculty/courses/{courseId}/groups`
- Body:
```json
{ "name": "Project Teams" }
```
- 201 with the created `MainGroupResponse` (id, name, subGroups[])

### Create a sub group
- `POST /api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups`
- Body:
```json
{ "name": "Team Alpha" }
```
- 201 with the created `SubGroupResponse` (id, name, students[])

### Add a student to a sub group
- `POST /api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups/{subGroupId}/students`
- Body:
```json
{ "studentId": 123 }
```
- 200 with updated `SubGroupResponse`
- Validation: student must exist, be enrolled in the course, and not already in the sub group.

### List all groups in a course
- `GET /api/v1/faculty/courses/{courseId}/groups`
- 200 with `List<MainGroupResponse>` including nested subgroups and students.

## Student endpoint
### List groups for an enrolled student
- `GET /api/v1/student/courses/{courseId}/groups`
- 200 with `List<MainGroupResponse>`
- Requires the student to be enrolled in the course.

## Responses
- `MainGroupResponse`: `{ id, name, subGroups: SubGroupResponse[] }`
- `SubGroupResponse`: `{ id, name, students: GroupStudentResponse[] }`
- `GroupStudentResponse`: `{ id, name, email }`

## Errors
- 400 for validation issues (missing name, duplicate names within course/main group, not enrolled, already member).
- 404 when course, main group, sub group, or student is not found.

## Notes
- Main group names are unique per course; sub group names are unique per main group.
- Membership uses a many-to-many join table `subgroup_students` keyed by `(sub_group_id, student_id)`.

