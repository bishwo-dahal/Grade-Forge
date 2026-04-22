---
layout: home

hero:
  name: Grade-Forge
  text: User manual
  tagline: Step-by-step help for students, faculty, grading assistants, and university admins

features:
  - title: Start here
    details: How paths and example URLs work, then the big picture.
    link: /manual/conventions
    linkText: URLs and paths
  - title: Every action
    details: Full list of tasks by role with steps, paths, and example links.
    link: /manual/actions/
    linkText: All actions
  - title: Who can do what
    details: Permission table with paths for each area.
    link: /manual/roles-and-permissions
    linkText: Open table
  - title: FAQ
    details: Tests, stdin, grades, admin settings.
    link: /manual/faq
    linkText: FAQ
---

![Grade-Forge Landing Page](/manual/images/landing.png)

## How Grade-Forge Works

Grade-Forge is a comprehensive educational platform designed to streamline and automate the coding assignment and grading lifecycle. It provides an integrated environment that empowers students, faculty, grading assistants, and university administrators to manage coursework efficiently.

**Key capabilities include:**
- **Automated Grading:** Execute and evaluate student code submissions securely against predefined test cases, providing immediate feedback.
- **Unified Workspace:** Students can write, run, and submit code directly within the platform.
- **Group Collaboration:** Seamlessly manage group assignments, team submissions, and shared feedback.
- **Plagiarism Detection:** Leverage AI-powered tools to identify code similarities and maintain academic integrity.
- **Course Management:** Faculty can organize calendars, upload materials, create rubrics, and track overall student performance.

By centralizing these functions, Grade-Forge reduces manual grading overhead and ensures consistent, reliable outcomes for computer science and engineering programs.

## ULM deployment

- **Application:** [https://ulm.gradeforge.tech](https://ulm.gradeforge.tech)
- **This manual in production:** [https://ulm.gradeforge.tech/docs/](https://ulm.gradeforge.tech/docs/)

## Recent documentation updates

- Example links in the manual now use the **ULM** host above (paths are unchanged).
- **Database seeding** supports a **minimal** mode (reference data + optional bootstrap admin) versus a **demo** mode for local testing; production should avoid demo data.
- **Load / stress testing** is documented with scripted checks, baseline tables, and production-safety guidance (separate test tokens; read-only checks in prod).
- **Test plan** and **implementation specifications** are maintained as separate submission documents alongside this VitePress manual.

The in-app **Documentation** link opens `/docs/`. The manual home looks like this:

![Documentation home](/manual/images/docs-home.png)

## Application Dashboard

Here is a preview of the Grade-Forge faculty dashboard in production:

![Grade-Forge Dashboard](/manual/images/faculty-dashboard-preview.png)

## Choose your role

| I am a… | Start page |
| ------- | ---------- |
| Student | [Student](/manual/roles/student) |
| Faculty | [Faculty](/manual/roles/faculty) |
| Grading assistant | [Grading assistant](/manual/roles/grading-assistant) |
| University admin | [University admin](/manual/roles/university-admin) |

## Feature topics

[Sign-in and account](/manual/features/sign-in-and-account) · [Courses and classes](/manual/features/courses-and-classes) · [Assignments and editor](/manual/features/assignments-and-editor) · [Tests and submissions](/manual/features/tests-and-submissions) · [Grading and feedback](/manual/features/grading-and-feedback) · [Rubrics and groups](/manual/features/rubrics-and-groups) · [Grading assistants](/manual/features/grading-assistants) · [Plagiarism and AI](/manual/features/plagiarism-and-ai-reports) · [University administration](/manual/features/university-administration) · [Calendar, materials, discussions](/manual/features/calendar-materials-discussions) · [Files and downloads](/manual/features/files-and-downloads)

## Developers

[API, Swagger, and repository](/manual/for-developers) (not part of the end-user manual).

## Older bookmarks

Pages such as **Getting started** or **Students guide** now redirect into this manual. Use [Overview](/manual/overview) if you are lost.
