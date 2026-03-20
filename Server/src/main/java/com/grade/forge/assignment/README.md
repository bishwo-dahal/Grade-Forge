# Assignment Controller API

Faculty-facing endpoints to manage assignments (including optional main group linkage).

Base path: `/api/v1/faculty/assignments`

## Create assignment
- `POST /api/v1/faculty/assignments`
- Body includes course/language details and optional `mainGroupId`:
```json
{
  "courseId": 1,
  "languageId": 2,
  "name": "HW1",
  "description": "Intro",
  "totalPoints": 100,
  "submissionType": "ONLINE",
  "availableFrom": "2024-09-01T00:00:00",
  "dueDate": "2024-09-10T23:59:00",
  "lateDueDate": "2024-09-12T23:59:00",
  "starterCodeUrl": "https://.../repo.zip",
  "rubricId": 5,
  "mainGroupId": 10
}
```
- 201 response: `AssignmentResponse` (includes `mainGroupId`/`mainGroupName`).

## Get assignment by id
- `GET /api/v1/faculty/assignments/{id}`
- 200 response: `AssignmentResponse`.

## List assignments by course
- `GET /api/v1/faculty/assignments/course/{courseId}`
- 200 response: `List<AssignmentBasicResponse>`.

## Update assignment
- `PUT /api/v1/faculty/assignments/{id}`
- Body mirrors create; include `mainGroupId` to change the linked group (must belong to the same course).
- 200 response: updated `AssignmentResponse`.

## Delete assignment
- `DELETE /api/v1/faculty/assignments/{id}`
- 200 response: confirmation message.

## Validation notes
- `mainGroupId`, when provided, must belong to the same course as the assignment.
- Rubric must belong to the same faculty as the course.
- Standard timeline checks: `dueDate` after `availableFrom`, `lateDueDate` after `dueDate` (if provided).

