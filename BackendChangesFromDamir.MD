# Change Report - Student File Upload Submission + Faculty File Visibility

Date: 2026-02-26
Branch: damirFileSubmissionAndGrading

## Backend validation summary
- Verified existing backend endpoints already support required workflow:
  - `POST /api/v1/student/submissions?assignmentId=...` (multipart `files` request part).
  - `GET /api/v1/faculty/submissions?assignmentId=...` (returns submission `files[]` with `fileName` and `downloadUrl`).
- Confirmed backend DTO contract includes submission file metadata:
  - `SubmissionResponse.files: List<SubmissionFileResponse>`
  - `SubmissionFileResponse`: `id`, `fileName`, `fileType`, `fileSize`, `downloadUrl`.
- Confirmed backend compile check passed with no code changes required.
- Result: no backend files were modified because current API + S3/presigned URL flow is already integration-ready for this feature.

## Frontend files changed

### 1) `Client/src/types/submission.ts`
- Added `SubmissionFileItem` type to centralize UI-facing file metadata shape.
- Extended `ClassSubmissionItem` with file-aware fields used by faculty class submissions table:
  - `files`
  - `primaryFileName`
  - `additionalFileCount`
  - `primaryDownloadUrl`
- Added `FacultyAssignmentSubmissionRow` for faculty assignment results tab rendering.
- Why: keeps file metadata strongly typed and reusable across service mappings and UI surfaces.

### 2) `Client/src/services/submissionService.ts`
- Added submission file response mapping helpers:
  - `SubmissionFileApiResponse`
  - `mapSubmissionFiles(...)`
- Added `submitStudentAssignmentFile(assignmentId, file)`:
  - Validates assignment id.
  - Validates extension (`.py`/`.java`).
  - Sends multipart form data under `files` to student submission endpoint.
- Updated `listClassSubmissions(classId)` to map faculty submission `files[]` into compact table metadata (`primaryFileName`, `+N`, download url).
- Added `listFacultyAssignmentSubmissionFiles(assignmentId)` to return full per-submission file lists for faculty results tab downloads.
- Removed obsolete local `classSubmissions` mock block that no longer matched the extended type contract.
- Why: this file is the integration seam for upload and faculty file visibility without touching backend code.

### 3) `Client/src/app/components/assignment/CodeWorkspace.tsx`
- Updated prop contract:
  - `onSubmit` now receives `File` and supports async.
  - Added `showUploadControls` (student-only UI toggle).
- Added upload UX next to `Run Tests`:
  - Hidden file input with `accept=".py,.java"`.
  - `Upload from computer` button.
  - Selected filename display.
- Added validation and gating:
  - Submit blocked unless one valid `.py`/`.java` file is selected.
  - Inline error message for invalid/missing file.
- Preserved existing confirmation modal; on confirm it now calls parent `onSubmit(selectedFile)`.
- Why: converts submit from mock behavior into a real file-driven workflow while keeping workspace mostly presentation-focused.

### 4) `Client/src/app/components/AssignmentPage.tsx`
- Added role-aware wiring via auth helper:
  - Student role gets upload controls.
  - Faculty role remains read-only for upload controls.
- Added async submit handler:
  - Calls `submitStudentAssignmentFile(...)`.
  - Reloads assignment workspace data after success so attempts/results visibility refresh immediately.
  - Shows success/error feedback banner.
- Added faculty-only data load for results tab file section:
  - Calls `listFacultyAssignmentSubmissionFiles(...)` and stores rows for `ResultsPanel`.
- Why: page-level container keeps all data loading and mutation orchestration centralized, per architecture rules.

### 5) `Client/src/app/components/assignment/ResultsPanel.tsx`
- Extended props with optional `facultySubmissionRows`.
- Added faculty-only `Submitted Files` section in results tab:
  - Shows student name + submitted timestamp.
  - Renders all submission files as download links when `downloadUrl` exists.
  - Shows safe empty states for missing files/data.
- Why: gives faculty full per-submission file visibility in assignment results without changing student results UI behavior.

### 6) `Client/src/app/components/FacultyClassPage.tsx`
- Updated submissions table:
  - Added `Files` column.
  - Displays compact file summary (`primaryFileName` + `+N more`).
- Updated actions:
  - Added direct primary file download action using backend presigned `downloadUrl`.
  - Provides disabled download icon when no file is available.
- Why: satisfies compact faculty class-level file visibility and download requirement.

## Verification performed
- Frontend build:
  - Command: `cd Client && npm run build`
  - Result: success.
- Backend compile smoke:
  - Command: `cd Server && mvn -DskipTests compile`
  - Result: success, no backend recompilation changes needed.

## Commit batches created
1. `wire submission file metadata and upload service methods`
2. `add student assignment file upload and real submit flow`
3. `show faculty submission files in class and assignment results`
