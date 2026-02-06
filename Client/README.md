# GradeForge Frontend
The UI uses mock data today, but the structure is intentionally designed so real backend services can be wired in with minimal UI changes.

## What This Repo Contains

- A student and faculty dashboard experience (GradeFlow).
- Pages for class, course, assignments, grading, and authentication screens.
- A dedicated mock service layer that simulates backend responses.

## Where Mock Data Lives (Replace These First)

All mock data functions are in `src/services/`. These are the only places that should be replaced with real API calls:

- `src/services/authService.ts`
- `src/services/classService.ts`
- `src/services/assignmentService.ts`
- `src/services/notificationService.ts`
- `src/services/resultService.ts`
- `src/services/submissionService.ts`

The UI components and pages should remain unchanged when you swap these functions to real calls.

## Data Shapes (Types)

All frontend data shapes are defined in `src/types/`. These types are UI-driven and only include fields currently used by the UI:

- `src/types/user.ts`
- `src/types/class.ts`
- `src/types/assignment.ts`
- `src/types/notification.ts`
- `src/types/grade.ts`
- `src/types/submission.ts`

When wiring backend responses, match these shapes. If the UI needs additional fields, update the types first.

---

# Step-by-Step Backend Integration Guide

This is a checklist to connect real backend services.

## Step 1: Decide your API base URL

Pick where the backend will live in dev and production.

Example (later):
- Dev: `http://localhost:4000`
- Prod: `https://api.yourdomain.com`

You will use this in one place in the service layer.

## Step 2: Replace mock services one by one

Each service file currently returns `Promise.resolve(mockData)`. Replace those with real API calls that return the same shape.

Example change (conceptually):

```ts
// Before (mock)
export function listEnrolledCourses(): Promise<CourseCard[]> {
  return Promise.resolve(enrolledCourses);
}

// After (real)
export async function listEnrolledCourses(): Promise<CourseCard[]> {
  const response = await fetch(`${API_BASE_URL}/courses`);
  return response.json();
}
```

Do this gradually for each service file.

## Step 3: Keep return shapes identical

The UI expects the data to look a certain way. Keep the same fields and names:

- If a backend field is named differently, map it in the service.
- If a field is missing, update the backend response or adjust the UI type.

This lets you avoid touching UI components later.

## Step 4: Add basic error handling (recommended)

Service functions should handle failures gracefully:

- If a call fails, return a safe fallback (`[]`, `null`, or a default object).
- Optionally log the error for debugging.

This avoids UI crashes while the backend is evolving.

## Step 5: Add loading states only if needed

Some pages already handle `null` or empty values.
If you add new async calls and see flicker or errors, add a simple loading check in the page component (not in the UI components).

## Step 6: Authentication

Right now the app is a mock flow. When you add authentication:

- Replace `getStudentProfile` and `getFacultyProfile`.
- Add token handling in a shared place (for example, a fetch wrapper).
- Keep UI components untouched.

## Step 7: Confirm routes

Routes are defined in `src/app/routes.tsx`.
If backend needs new pages or parameters, update routes there only.


# Suggested Backend-to-Frontend Mapping

Here is a simple overview of what each service represents:

- `authService` → current user profile
- `classService` → classes, courses, rosters, class headers
- `assignmentService` → assignments, details, rubrics, editor examples
- `submissionService` → submissions list and submission details
- `resultService` → grades, charts, score summaries
- `notificationService` → alerts, calendar items, tasks

---

# Developer Notes

- Keep all real API logic in `src/services/`.
- Keep all UI-only concerns in `src/app/components/`.
- Keep all types in `src/types/`.
- Avoid changing component structure unless the UI truly needs new data.