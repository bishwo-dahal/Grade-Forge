# Group API

Endpoints for the Course → MainGroup → SubGroup hierarchy and student membership.

## Roles and base paths
- Faculty manage groups under `/api/v1/faculty/courses/{courseId}/groups`
- Students read group hierarchy under `/api/v1/student/courses/{courseId}/groups`

## Faculty endpoints
### Create a main group
- Method: `POST`
- Path: `/api/v1/faculty/courses/{courseId}/groups`
- Request body:
```json
{ "name": "Project Teams" }
```
- Sample 201 response:
```json
{
  "id": 1,
  "name": "Project Teams",
  "subGroups": []
}
```

### Create a sub group
- Method: `POST`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups`
- Request body:
```json
{ "name": "Team Alpha" }
```
- Sample 201 response:
```json
{
  "id": 10,
  "name": "Team Alpha",
  "students": []
}
```

### Add a student to a sub group
- Method: `POST`
- Path: `/api/v1/faculty/courses/{courseId}/groups/{mainGroupId}/subgroups/{subGroupId}/students`
- Request body:
```json
{ "studentId": 123 }
```
- Sample 200 response:
```json
{
  "id": 10,
  "name": "Team Alpha",
  "students": [
  { "id": 123, "name": "Jane Doe", "email": "jane@example.edu", "cwid": "CW123" }
  ]
}
```
- Validation: student must exist, be enrolled in the course, and not already in the sub group.

### List all groups in a course
- Method: `GET`
- Path: `/api/v1/faculty/courses/{courseId}/groups`
- Sample 200 response:
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

## Student endpoint
### List groups for an enrolled student
- Method: `GET`
- Path: `/api/v1/student/courses/{courseId}/groups`
- Sample 200 response:
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
- Requires the student to be enrolled in the course.

## Responses
- `MainGroupResponse`: `{ id, name, subGroups: SubGroupResponse[] }`
- `SubGroupResponse`: `{ id, name, students: GroupStudentResponse[] }`
- `GroupStudentResponse`: `{ id, name, email, cwid }`

## Errors
- 400 for validation issues (missing name, duplicate names within course/main group, not enrolled, already member).
- 404 when course, main group, sub group, or student is not found.

## Notes
- Main group names are unique per course; sub group names are unique per main group.
- Membership uses a many-to-many join table `subgroup_students` keyed by `(sub_group_id, student_id)`.



