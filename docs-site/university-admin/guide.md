# University admin guide — tasks

Reference for **university administrators** configuring Grade-Forge for an institution.

## Workspace layout

- After sign-in you land in the university shell (default section **Faculty**).
- Use the top bar **search** placeholder text covers faculty, semesters, courses, languages, and activity (exact behavior follows the live UI).
- **Settings** (including profile) live under **`/university-admin/settings`**, not the generic `/settings` route used by students/faculty.

## Faculty

| Task | Typical use |
|------|-------------|
| Manage faculty records | **Faculty** (`/university-admin/faculty`) |
| Align faculty with departments / courses | Follow forms and tables in the live UI |

## Semesters

| Task | Typical use |
|------|-------------|
| Create and maintain terms | **Semesters** (`/university-admin/semesters`) |
| Tie courses to active terms | Coordinated with **Courses** |

## Courses

| Task | Typical use |
|------|-------------|
| Institution course catalog / ownership | **Courses** (`/university-admin/courses`) |
| Associate courses with semesters and faculty | Per UI workflows |

## Programming languages

| Task | Typical use |
|------|-------------|
| Configure allowed languages for assignments | **Languages** (`/university-admin/languages`) |

## Users

| Task | Typical use |
|------|-------------|
| Provision or manage users / roles as supported | **Manage users** (`/university-admin/manage-users`) |

## Monitoring

| Task | Typical use |
|------|-------------|
| Review operational / activity signals | **Monitor** (`/university-admin/monitor`) |

## Settings

| Task | Where |
|------|--------|
| Admin profile and preferences | **`/university-admin/settings`** (and top-bar account menu) |

## What university admins do *not* do in this workspace

- Student submission of code or faculty day-to-day grading — those stay in **student** and **faculty** / **GA** experiences.

Institution-specific policies (enrollment, LDAP, email) depend on how your deployment is configured; use this guide for **in-app navigation and tasks** only.
