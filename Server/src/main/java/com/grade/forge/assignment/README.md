# Assignment API notes

This project now supports optional multi-file starter code stored in S3 alongside submissions.

## Endpoints (faculty)
- `POST /api/v1/faculty/assignments` (multipart)
  - Parts:
    - `assignment` (JSON, `AssignmentRequest`)
    - `starterFiles` (optional file[])
- `PUT /api/v1/faculty/assignments/{id}` (multipart)
  - Parts:
    - `assignment` (JSON, partial `AssignmentRequest` for fields to update)
    - `starterFiles` (optional file[]; if present, replaces existing starter files; send empty list to clear)
- `GET /api/v1/faculty/assignments/{id}` returns `AssignmentResponse` (includes presigned download URLs for starter files)

## Request JSON (`AssignmentRequest`)
```json
{
  "courseId": 1,
  "languageId": 1,
  "name": "Assignment 1",
  "description": "Intro to loops",
  "totalPoints": 100,
  "submissionType": "FILE", // enum
  "availableFrom": "2024-01-01T12:00:00",
  "dueDate": "2024-01-08T12:00:00",
  "lateDueDate": "2024-01-10T12:00:00",
  "rubricId": 5,
  "mainGroupId": 3
}
```

## Response JSON (`AssignmentResponse`)
```json
{
  "id": 10,
  "courseId": 1,
  "courseName": "CS101",
  "languageId": 1,
  "languageName": "Python",
  "languageAllowedExtensions": ".py,.txt,.csv",
  "name": "Assignment 1",
  "description": "Intro to loops",
  "totalPoints": 100,
  "submissionType": "FILE",
  "starterCodeFiles": [
    {
      "id": 42,
      "fileName": "starter.py",
      "fileKey": "uploads/faculty/course/1/assignment/10/starter/uuid-starter.py",
      "fileType": "text/x-python",
      "fileSize": 1234,
      "downloadUrl": "<presigned GET url>"
    }
  ],
  "availableFrom": "2024-01-01T12:00:00",
  "dueDate": "2024-01-08T12:00:00",
  "lateDueDate": "2024-01-10T12:00:00",
  "rubricId": 5,
  "rubricName": "Loops rubric",
  "mainGroupId": 3,
  "mainGroupName": "Group A"
}
```

## Notes
- Starter files are validated against the assignment language allowed extensions (plus .txt/.csv) and stored in S3 under `uploads/faculty/course/{courseId}/assignment/{assignmentId}/starter/`.
- Responses include presigned download URLs (short-lived) for each starter file, similar to submission file responses.

