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

## Follow-up Fix Report - Submission Feedback + Faculty Visibility Refresh

Date: 2026-02-26
Scope: Debug/fix after user-reported issue where submit gave no visible progress and faculty views did not immediately show uploaded files.

### Root causes addressed
1. Submission UX gap:
- The confirmation modal closed immediately when submit started, so users did not get clear "saving" progress in-context.
- Success/failure feedback was easy to miss because it only appeared in page-level area.

2. Data freshness gap:
- Assignment/result service layers cache per-assignment workspace payloads.
- After new submission, cached data could make assignment/faculty views show stale state/files until hard refresh.

3. Browser MIME edge case:
- Some browsers can send empty file MIME for `.java`/`.py`; backend validates `fileType` and may reject if missing.

### Files updated in this follow-up

#### `Client/src/app/components/assignment/SubmitConfirmModal.tsx`
- Added `isSubmitting` + `errorMessage` props.
- Submit button now shows spinner (`Loader2`) and "Saving..." text while request is in flight.
- Disabled cancel/close controls during active submit to prevent accidental interruption.
- Added inline modal error rendering for failed API saves.
- Why: user now sees explicit progress and immediate error cause in the same action context.

#### `Client/src/app/components/assignment/CodeWorkspace.tsx`
- Added submit error parser helper and modal-level error state (`submitModalError`).
- Changed submit flow to keep modal open while submit is running; close only on success.
- Added explicit success message (`Submitted successfully.`) near workspace action controls after backend success.
- Cleared stale success/error message when choosing a new file.
- Why: submit now has visible lifecycle: validating -> saving spinner -> success/error confirmation.

#### `Client/src/services/assignmentService.ts`
- Added `invalidateAssignmentWorkspaceCache(assignmentId?)` export.
- Clears student/faculty assignment workspace caches either globally or per-assignment.
- Why: avoids stale assignment submission data across role switches and post-submit reloads.

#### `Client/src/services/resultService.ts`
- Added `invalidateAssignmentResultCache(assignmentId?)` export.
- Clears student/faculty result caches either globally or per-assignment.
- Why: ensures latest result/submission state after file submission events.

#### `Client/src/app/components/AssignmentPage.tsx`
- Integrated cache invalidation before loading assignment workspace data.
- Integrated cache invalidation immediately after successful student submit before reload.
- Added periodic refresh (15s) while faculty is on Results tab, so new incoming submissions/files appear without manual reload.
- Why: fixes stale faculty/student assignment views and improves near-real-time visibility.

#### `Client/src/services/submissionService.ts`
- Added `normalizeUploadFileType(file)` helper.
- If browser omits MIME type, assigns fallback type (`text/x-java-source` or `text/x-python`) before multipart upload.
- Why: satisfies backend `fileType` validation reliably for `.java` and `.py` uploads.

#### `Client/src/app/components/FacultyClassPage.tsx`
- Submissions section now has robust reload behavior:
  - Added reusable async loader with loading/error states.
  - Added manual `Refresh` button with spinner state.
  - Added 15s polling while section is open.
  - Added skeleton rows during initial loading.
- Why: faculty submissions table now updates quickly after student uploads and gives clear loading feedback.

### Verification run
- Frontend build: `cd Client && npm run build` -> success.

### Backend impact
- No backend code changed.
- Existing backend endpoints remain unchanged; frontend fixes improve contract compliance and data freshness around those endpoints.

## Follow-up Fix Report - 400 Multipart Submission Error

Date: 2026-02-26
Scope: Debugged student submit failure showing `Request failed with status code 400` on `POST /api/v1/student/submissions?assignmentId=...`.

### Root cause
- Frontend Axios client was globally forcing `Content-Type: application/json` for all requests.
- Student submission upload uses `FormData` and backend expects `multipart/form-data`.
- With JSON content type forced, Spring could reject upload parsing and return 400.

### Files updated

#### `Client/src/api/axios.ts`
- Removed global default `Content-Type: application/json` from axios instance creation.
- Added request-interceptor guard:
  - When request body is `FormData`, remove `Content-Type` header so browser sets multipart boundary automatically.
- Why: multipart upload correctness depends on browser-managed content-type boundary.

#### `Client/src/services/submissionService.ts`
- Kept upload call as plain `api.post(url, formData)`.
- Added inline note that interceptor handles multipart header behavior.
- Why: avoids manually forcing headers and keeps upload contract stable.

### Verification
- Frontend build: `cd Client && npm run build` -> success.

### Backend impact
- No backend code changes needed.
- This fix aligns frontend request format with existing backend multipart controller contract.
