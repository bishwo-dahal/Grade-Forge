# Getting started

## Accounts and roles

| Role | Typical use |
|------|-------------|
| **Student** | Enroll in classes, submit assignments, run tests, view grades. |
| **Faculty** | Run classes, create assignments, grade work, manage rubrics and grading assistants. |
| **Grading assistant** | Help grade in assigned courses under faculty direction. |
| **University admin** | Configure semesters, courses, faculty, languages, users, and monitoring for the institution. |

## Sign up and sign in

1. Open **Sign up** to create an account (your institution may restrict who can register).
2. Use **Sign in** for returning visits.
3. After login you are routed to the workspace for your role (dashboard, grading-assistant courses, or university admin).

## First-time students

If your account requires it, complete **Complete registration** (`/complete-registration`) before using courses.

## Settings

- **Students, faculty, and grading assistants:** **Settings** in the sidebar (`/settings`) — profile, security, notifications, appearance.
- **University admins:** open **Settings** from the university workspace (`/university-admin/settings`).

## Help

Use **Documentation** in the app sidebar or header to open this site (`/docs/`).

## Local development note

If you use the Vite dev server on port **5173**, **`/docs`** is proxied to the Spring app when it runs on **8080**; run `./scripts/build-and-sync-docs.sh` so docs exist on the backend.
