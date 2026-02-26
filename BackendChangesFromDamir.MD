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

## Follow-up Feature Report - Faculty "See in editor" Submission Viewer

Date: 2026-02-26
Scope: Added faculty-only assignment workspace flow to preview student submission files directly in Monaco editor using existing presigned S3 download URLs.

### Backend readiness + impact
- No backend code was modified.
- Existing backend contract was reused:
  - `GET /api/v1/faculty/submissions?assignmentId=...` for per-submission file metadata (`fileName`, `downloadUrl`).
  - Presigned S3 `downloadUrl` for file retrieval.
- Frontend uses direct `fetch(downloadUrl)` for content preview to avoid API client auth-header interference.

### Files changed

#### `Client/src/types/submission.ts`
- Added `FacultySubmissionFileOption`:
  - Flattened option shape for faculty selector dropdown.
  - Carries `optionId`, student name, file name, submitted time, and `downloadUrl`.
- Added `FacultyEditorPreviewPayload`:
  - Minimal payload needed to render selected submission code in editor (`fileName`, `language`, `content`).
- Why: keeps UI contract explicit and reusable between container (`AssignmentPage`) and presentation component (`CodeWorkspace`).

#### `Client/src/services/submissionService.ts`
- Added `resolvePreviewLanguage(fileName, fallbackLanguage)`:
  - Maps `.py` -> `Python`, `.java` -> `Java`, fallback for resilience.
- Added `fetchSubmissionFileText(downloadUrl, fileName)`:
  - Validates previewable extension (`.py`/`.java`).
  - Fetches text content from presigned URL with native `fetch`.
  - Raises clear errors for invalid extension, missing URL, or non-200 response.
- Why: centralizes file preview data retrieval and language resolution in service layer; keeps components view-focused.

#### `Client/src/app/components/editors/MonacoEditor.tsx`
- Added optional `readOnly?: boolean` prop (default `false`).
- Wired prop into Monaco editor options (`readOnly`).
- Why: enables reviewer-style inspection mode without creating a separate editor component.

#### `Client/src/app/components/AssignmentPage.tsx`
- Added container-level mapping from `facultySubmissionRows` to flattened `facultySubmissionFileOptions` for selector UI.
- Added `requestFacultyEditorPreview(optionId)` callback:
  - Finds selected option.
  - Loads file text using `fetchSubmissionFileText`.
  - Resolves language via `resolvePreviewLanguage`.
  - Returns `FacultyEditorPreviewPayload` to workspace component.
- Passed faculty-only props to `CodeWorkspace`:
  - `showFacultyViewerControls`
  - `facultySubmissionFileOptions`
  - `onRequestFacultyEditorPreview`
- Why: preserves page/container ownership of data loading and side effects; keeps workspace presentational for this flow.

#### `Client/src/app/components/assignment/CodeWorkspace.tsx`
- Added faculty-only `See in editor` button next to `Run Tests`.
- Added faculty selector modal:
  - Dropdown of all flattened submission file options.
  - `Show in editor` action.
  - Inline loading spinner and inline error message.
  - Empty-state handling when no files are available.
- Added preview application logic:
  - On success, replaces current workspace tree/content with selected file.
  - Updates tab/file tree display to selected file name.
  - Switches editor to read-only and uses resolved preview language.
- Kept student submit/upload workflow unchanged.
- Why: satisfies faculty review UX while preserving existing assignment workspace structure.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Commits
1. `498a74e` add faculty see-in-editor submission preview flow

## Follow-up Fix Report - Student Resubmission Confirmation Prompt

Date: 2026-02-26  
Scope: Added explicit student-facing confirmation text when a learner tries to submit an assignment after already submitting once.

### Backend readiness + impact
- No backend code was modified.
- No API contract changes were needed.
- This is a frontend confirmation UX improvement only.

### Files changed

#### `Client/src/app/components/assignment/SubmitConfirmModal.tsx`
- Added derived state `hasSubmittedBefore` based on `submissionsUsed > 0`.
- Added a conditional warning panel shown only for resubmissions:
  - Message states the student already submitted.
  - Asks clearly whether they want to submit again and replace previous submission.
- Updated submit CTA label dynamically:
  - First submission: `Submit for Grading`
  - Resubmission: `Submit Again`
- Added inline `// FIX:` comment to document intent and future maintenance context.
- Why: gives an explicit and unambiguous confirmation step for repeat submissions, matching requested workflow.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged; existing submit endpoint continues to handle submission persistence.

## Follow-up Feature Report - Submit Editor Code As Source File

Date: 2026-02-26  
Scope: Added student workflow support to submit code typed directly in the editor without requiring a manual local file upload.

### Backend readiness + impact
- No backend code was modified.
- Existing endpoint contract remains unchanged:
  - `POST /api/v1/student/submissions?assignmentId=...` multipart with `files`.
- Frontend now generates a valid `.py` or `.java` file from editor code when no upload is selected, then submits through the same API path.

### Files changed

#### `Client/src/app/components/assignment/CodeWorkspace.tsx`
- Added helper `getSubmissionMimeType(fileName)` to assign backend-safe MIME types for generated submission files.
- Added `editorSubmissionCandidate` derivation logic:
  - Checks selected file, then `main`, then remaining workspace files.
  - Picks first non-empty code content.
  - Ensures submission filename is valid (`.py`/`.java`) and falls back to language-based `main` filename if needed.
- Updated submit gating:
  - Submit is enabled when either a valid uploaded file exists OR editor has non-empty code.
  - Shows clear validation error if both are missing.
- Updated confirm submit flow:
  - Uses uploaded file when present.
  - Otherwise creates a `File` from editor content and submits it through existing `onSubmit` callback.
- Added UI hint below action bar to explain that editor code will be submitted as a source file when no upload is selected.
- Why: lets students complete the assignment fully inside the in-browser editor while preserving existing backend file submission contract.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged.
- Feature is additive and reuses current multipart submission pipeline.

## Follow-up Feature Report - Full Assignment Create Fields + Rubric Selection

Date: 2026-02-26  
Scope: Expanded faculty assignment creation flow so the page captures all currently persisted assignment fields and allows selecting existing faculty rubrics.

### Backend readiness + impact
- No backend code was changed.
- Frontend now sends full `AssignmentRequest`-aligned payload fields supported by backend:
  - `courseId`, `languageId`, `name`, `description`, `totalPoints`, `submissionType`, `starterCodeUrl`, `availableFrom`, `dueDate`, `lateDueDate`, `rubricId`.
- Rubric options are loaded from existing faculty rubric endpoint.

### Files changed

#### `Client/src/types/assignment.ts`
- Expanded `AssignmentCreateFormData` to include backend-backed create fields:
  - `availableFromDate`, `availableFromTime`
  - `lateDueDate`, `lateDueTime`
  - `submissionType`
  - `starterCodeUrl`
  - `rubricId`
- Added `AssignmentSubmissionType` union (`INDIVIDUAL | GROUP`).
- Expanded `FacultyAssignmentCreatePageData` with `rubricOptions`.
- Added inline `// NOTE:` comments describing why each new field exists and its backend mapping.

#### `Client/src/services/assignmentService.ts`
- Expanded default create form seed with new fields.
- Added rubric option API shape + safe loader:
  - `listFacultyRubricOptions()` handles backend 404 as empty list.
- Added `buildOptionalDateTimePayload()` for optional LocalDateTime fields.
- Updated `getFacultyAssignmentCreatePageData()` to fetch:
  - course header
  - active languages
  - faculty rubrics
- Updated create payload in `createFacultyAssignmentDraft()` to include:
  - dynamic `submissionType`
  - optional `starterCodeUrl`
  - optional `availableFrom`
  - required `dueDate`
  - optional `lateDueDate`
  - optional `rubricId`
- Added inline `// NOTE:` and `// FIX:` comments for backend contract and resiliency behavior.

#### `Client/src/app/components/FacultyCreateAssignmentPage.tsx`
- Added new form controls for missing backend-backed fields:
  - Available From (date/time)
  - Late Due Date (date/time)
  - Submission Type selector
  - Rubric selector (from faculty-created rubrics)
  - Starter Code URL input
- Added empty-rubric helper text directing faculty to Add Rubric flow.
- Added client-side validation for timeline/data quality:
  - Optional datetime fields must include time when date is provided.
  - Available-from cannot be after due date.
  - Late due cannot be before due date.
  - Starter URL must start with `http://` or `https://` when provided.
- Removed outdated placeholder note claiming rubric/starter settings were deferred.
- Added inline `// NOTE:` and `// FIX:` comments for integration intent.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged.
- Frontend create flow now fully maps to fields currently supported by backend assignment entity/request.

## Follow-up UI Refinement - Assignment Create Form Organization + Rubric Quick Add

Date: 2026-02-26  
Scope: Reorganized faculty assignment creation UI into clearer sections, removed the small course subtitle under heading, and added a rubric quick-add action with plus icon.

### Backend readiness + impact
- No backend code changes.
- Existing assignment create payload and validation flow remain unchanged.
- Rubric quick-add uses existing frontend route `/faculty/rubrics/new`.

### Files changed

#### `Client/src/app/components/FacultyCreateAssignmentPage.tsx`
- Removed the small course-code/course-name subtitle line under page heading as requested.
- Reworked form layout into grouped sections for better structure:
  - `Basics`
  - `Schedule`
  - `Points, Rubric, and Resources`
- Normalized field spacing and grouping so related controls are no longer visually scattered.
- Added rubric quick action button with plus icon (`Add Rubric`) beside rubric selector.
- Wired new `onCreateRubric` view prop to container callback.
- Added container handler `handleCreateRubric()` that navigates to rubric creation page.
- Kept all existing field behavior and timeline validation logic intact.
- Added inline `// REFACTOR:` and `// NOTE:` comments documenting intent and integration seam.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged.
- UI-only improvement with no payload contract changes.

## Follow-up UI Cleanup - Remove Subtitle/Back Arrow + Single-Row Schedule Controls

Date: 2026-02-26  
Scope: Tightened assignment create page header area and aligned schedule controls into one row on desktop.

### Backend readiness + impact
- No backend changes.
- No payload/schema changes.

### Files changed

#### `Client/src/app/components/FacultyCreateAssignmentPage.tsx`
- Removed subtitle text under page heading:
  - Deleted `Create a new coding assignment for this class.`
- Removed top back-arrow link (`Back to Class`) from above breadcrumbs.
- Kept breadcrumbs and bottom cancel action intact for navigation context.
- Refactored schedule layout:
  - Changed schedule section wrapper from single-column stack to `lg:grid-cols-3`.
  - Available From, Due Date & Time, and Late Due Date & Time now align in one row on desktop.
  - Mobile still stacks naturally.
- Removed unused imports/variables (`ArrowLeft`, `courseName`) after cleanup.
- Added inline `// REFACTOR:` comment documenting the one-row schedule alignment intent.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged.

## Follow-up UX Feature - Assignment Create Success Modal + Return-to-Class Action

Date: 2026-02-26  
Scope: Replaced inline success banner with a modal confirmation after assignment creation, including direct navigation back to class.

### Backend readiness + impact
- No backend changes.
- Assignment creation API call remains the same.

### Files changed

#### `Client/src/app/components/FacultyCreateAssignmentPage.tsx`
- Updated create view props:
  - Removed `successMessage` prop.
  - Added `showSuccessModal`, `onCloseSuccessModal`, `onGoBackToClass`.
- Removed inline success banner from page body.
- Added centered modal overlay shown after successful assignment creation:
  - Title: `Assignment Created`
  - Message: assignment created successfully
  - Actions:
    - `Stay Here` closes modal
    - `Go Back to Class` navigates to current class page
- In container state:
  - Replaced `successMessage` state with `showSuccessModal` boolean.
  - On successful creation, toggles modal open.
  - Added handlers for closing modal and navigating to `/faculty/class/:classId`.
- Added inline `// NOTE:` comment documenting why confirmation is modal-based.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged.
- UI flow enhancement only.

## Follow-up Fix - Real Rubric Data in Rubric Tab + Remove Duplicate Rubric Section from Description

Date: 2026-02-26  
Scope: Replaced placeholder rubric content in Assignment > Grading Rubric tab with real rubric criteria (faculty view) and removed redundant Grading Rubric heading/section from Description tab.

### Backend readiness + impact
- No backend code changes.
- Reused existing rubric API endpoint already available for faculty:
  - `GET /api/v1/faculty/rubrics/{id}`
- Assignment model already includes `rubricId` in response payload.

### Files changed

#### `Client/src/services/assignmentService.ts`
- Imported rubric service helper:
  - `getRubric` from `rubricService`.
- Extended `AssignmentApiResponse` type with optional rubric fields:
  - `rubricId?: number | null`
  - `rubricName?: string | null`
- Replaced `listRubricCategories()` placeholder implementation with real mapping flow:
  1. Load assignment workspace source.
  2. Read `assignment.rubricId`.
  3. If no rubric id -> return empty list.
  4. For faculty role, fetch rubric by id and map criteria to `RubricCategory` shape.
  5. On fetch failure -> return empty list (no placeholder fallback).
- Added inline comments:
  - `// NOTE:` for student-role endpoint limitations.
  - `// FIX:` for fallback behavior preventing placeholder regressions.

#### `Client/src/app/components/assignment/DescriptionPanel.tsx`
- Removed the entire in-description `Grading Rubric` section and heading.
- Left a `// CLEANUP:` comment explaining rubric content now belongs in dedicated rubric tab.
- Why: avoids duplicated rubric content and removes misleading placeholder display inside Description tab.

### Verification
- Frontend build check run:
  - `cd Client && npm run build` -> success.

### Backend impact
- Backend unchanged.
- Frontend now consumes existing rubric API for real rubric rendering where available.
