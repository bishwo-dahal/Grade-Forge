# Group API

Endpoints for Course → MainGroup → SubGroup hierarchy and student membership.

## Roles & Base Paths
- Faculty manage groups: `/api/v1/faculty/courses/{courseId}/groups`
- Students view groups: `/api/v1/student/courses/{courseId}/groups`

## Faculty Endpoints
### Create main group
- Method: `POST`
- Path: `/api/v1/faculty/courses/{courseId}/groups`
- Request:
```json
{ "name": "Project Teams" }
```
- 201 Response:
```json
{ "id": 1, "name": "Project Teams", "subGroups": [] }
```

### Update main group name
- Method: `PUT`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}`
- Request:
```json
{ "name": "Project Teams - Updated" }
```
- 200 Response: `MainGroupResponse`

### Delete main group (cascades subgroups)
- Method: `DELETE`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}`
- 200 Response: confirmation message

### List all groups in a course
- Method: `GET`
- Path: `/api/v1/faculty/courses/{courseId}/groups`
- 200 Response:
```json
[
  {
    "id": 1,
    "name": "Project Teams",
    "subGroups": [
      {
        "id": 10,
        "name": "Team Alpha",
        "students": [
          { "id": 123, "name": "Jane Doe", "email": "jane@example.edu", "cwid": "CW123" }
        ]
      }
    ]
  }
]
```

### Create sub group
- Method: `POST`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups`
- Request:
```json
{ "name": "Team Alpha" }
```
- 201 Response: `SubGroupResponse`

### Update sub group name
- Method: `PUT`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups/{subGroupId}`
- Request:
```json
{ "name": "Team Alpha - Backend" }
```
- 200 Response: `SubGroupResponse`

### Delete sub group
- Method: `DELETE`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups/{subGroupId}`
- 200 Response: confirmation message

### Add student to sub group
- Method: `POST`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups/{subGroupId}/students`
- Request:
```json
{ "studentId": 123 }
```
- 200 Response:
```json
{
  "id": 10,
  "name": "Team Alpha",
  "students": [
    { "id": 123, "name": "Jane Doe", "email": "jane@example.edu", "cwid": "CW123" }
  ]
}
```
- Validation: student must exist, be enrolled in the course, and not already in any sub group of the same main group.

### Remove student from sub group
- Method: `DELETE`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups/{subGroupId}/students/{studentId}`
- 200 Response: updated `SubGroupResponse`

## Student Endpoint
### List groups for enrolled student
- Method: `GET`
- Path: `/api/v1/student/courses/{courseId}/groups`
- 200 Response mirrors faculty list response (see above)
- Requires the student to be enrolled in the course.

## Response Shapes
- `MainGroupResponse`: `{ id, name, subGroups: SubGroupResponse[] }`
- `SubGroupResponse`: `{ id, name, students: GroupStudentResponse[] }`
- `GroupStudentResponse`: `{ id, name, email, cwid }`

## Errors
- 400: validation (missing name, duplicate names within course/main group, not enrolled, already in sub group, not in sub group when removing).
- 404: course, main group, sub group, or student not found.

## Notes
- Main group names are unique per course; sub group names are unique per main group.
- Students can belong to multiple sub groups across different main groups, but only one sub group per main group.
- Membership uses join table `subgroup_students` keyed by `(sub_group_id, student_id)`.



