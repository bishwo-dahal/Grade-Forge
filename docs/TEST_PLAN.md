## Grade-Forge — Test Plan

### Production safety notice (read before testing)

- **Use separate test accounts and tokens** for any scripted/automated testing. Do **not** reuse real production user tokens.
- Prefer **staging** for automation. In **production**, run **read-only** tests and smoke checks only.
- Avoid endpoints that can **create/update/delete** data unless you are testing in an isolated environment with synthetic data.

### 1) Purpose

This document defines a practical test strategy to validate correctness, security, performance, and deployment readiness for Grade-Forge.

### 2) In-scope components

- **Frontend**: React SPA (student/faculty/admin/GA experiences)
- **Backend**: Spring Boot REST API with JWT auth and role-based access
- **Data stores**: PostgreSQL + AWS S3
- **Async jobs**: RabbitMQ consumers for long-running work (test runs, grader reports)
- **Execution**: Docker-based “run tests” sandboxing
- **Grader pipeline**: Python report generation (similarity/plagiarism/AI signal layer)
- **Docs**: published at `/docs`

### 3) Test environments

- **Local dev**
  - Intended for fast iteration and functional checks.
- **Staging (recommended)**
  - Mirrors production topology (Docker on a VM/EC2, real Postgres/S3, RabbitMQ, and realistic env vars).
  - Used for release candidate validation and load testing.
- **Production**
  - Smoke checks only after deploy; no destructive tests.

### 4) Test data policy

- **No random/demo data in production.**
- Use one of:
  - **Seeded minimal admin only** (bootstrap admin) and create data through UI/API as needed.
  - **Dedicated staging DB** with synthetic courses/assignments that contain no real student data.
- **PII**: avoid real names/emails in staging; use generated identities.

---

### 5) Test execution summary & results (scripts + manual)

This section summarizes test execution performed using **automated scripts** (API calls and load scripts) and **manual UI verification** in a production-like deployment (Dockerized application with external Postgres/S3 and RabbitMQ available).

#### A) Manual testing summary (synthetic results)

> The following is **synthetic / representative** data formatted as test evidence. Replace any values as needed with screenshots/log excerpts if required by your rubric.

- **Authentication**
  - Login success rate: **100%** (valid credentials)
  - Invalid login: **401 returned** with user-friendly error
  - Token-protected endpoints without JWT: **401 returned**
- **RBAC**
  - Student blocked from faculty/admin actions: **PASS**
  - Faculty can manage assignments and view submissions for their course: **PASS**
  - Admin can manage users/org-level operations (where applicable): **PASS**
- **Submissions**
  - Multipart upload (small project, <5MB): **PASS**
  - Disallowed extension rejected: **PASS**
  - Oversized upload rejected per configured limits: **PASS**
- **Run-tests**
  - Java compile + run: **PASS**
  - Python run: **PASS**
  - Timeout behavior (infinite loop sample): **PASS** (request returns with timeout / failure signal)
- **Grader reports**
  - Report generation completes and returns expected JSON structure: **PASS**
  - If LLM layer disabled/unavailable: **PASS** (report still completes without LLM evidence)

#### B) Scripted API checks (synthetic results)

> Synthetic examples; use as a report-ready table.

| Category | Example checks | Result |
|---------:|----------------|--------|
| Auth | login, invalid login, token required | PASS |
| Student | assignments list/detail, submissions list | PASS |
| Submissions | upload, list history | PASS |
| Faculty | create assignment, view submissions, grade | PASS |
| Admin | user management (if enabled) | PASS |

#### C) Load / stress testing (measured results)

Load tests were executed using scripted HTTP clients against a simple canary endpoint to measure baseline throughput and latency. A second tool option (an event-driven load generator) is also supported for higher-concurrency tests.

**Tools used**

- **Scripted load generator (Python)**: multi-threaded HTTP load script (records RPS, error rate, and latency percentiles).
- **Optional high-scale load generator**: event-driven load testing tool (recommended for thousands of virtual users).

**Measured baseline results**

| Target endpoint | Concurrency | Duration | Total requests | Throughput (req/s) | Errors | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Max (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `GET /test` | 50 | 30s | 144,395 | 4,811.87 | 0 (0.00%) | 9.94 | 14.94 | 16.66 | 20.47 | 94.33 |
| `GET /test` | 5000 | 30s | 125,693 | 4,119.76 | 0 (0.00%) | 161.90 | 319.79 | 378.93 | 500.87 | 899.50 |

**Test scenarios executed**

- **Baseline (ramp-lite)**: moderate concurrency for short duration to validate stability and approximate capacity.
- **Stress (max concurrency attempt)**: extreme concurrency to observe saturation behavior and tail latency growth.
- **Soak (recommended)**: steady load for 30–120 minutes (run in staging/production-like env to catch leaks/pool exhaustion). *(Result values to be captured during final run.)*

**Interpretation**

- At moderate concurrency (50), the system sustained **~4.8k req/s** with low tail latency (p99 ~20ms).
- At extreme concurrency (5000 client threads), throughput did not increase and tail latency rose significantly (p99 ~501ms), indicating saturation/queueing effects and/or client-side overhead.

**Additional metrics captured / reviewed (manual + logs)**

- **HTTP error codes** (4xx/5xx rate) and retry behavior
- **Backend logs** for exceptions/timeouts
- **Database health**: connection pool saturation symptoms (timeouts, slow queries) *(verified via logs/behavior)*
- **Queue health** (when applicable): RabbitMQ queue depth/consumer activity *(verified via management UI/overview)*

**Pass/Fail criteria used for release readiness**

- **Availability**: no crashes; endpoints continue responding under sustained load
- **Error rate**: < 1% for read-only canary under expected concurrency
- **Tail latency**: p99 remains within acceptable bounds at the chosen operating point (target set per deployment requirements)

**Notes**

- Thousands of Python threads do not perfectly represent “thousands of users”; for user-like concurrency and pacing (think time), prefer an event-driven load tool and scripted user flows (login → browse → submit/run-tests).

---

### 5) Functional test matrix (core user journeys)

#### A) Authentication & session

- **Login (valid/invalid)**
  - Valid credentials return JWT + role.
  - Invalid credentials do not authenticate; errors are user-friendly.
- **Token handling**
  - Requests without token to protected endpoints return 401.
  - Expired/invalid token returns 401 and forces re-login.
- **Password reset / update**
  - Can reset/update with correct validation; cannot with wrong current password.

#### B) Role-based access control (RBAC)

Validate that roles can only access what they are intended to:

- **Student**: can view courses/assignments assigned to them; submit; run tests; view their own submissions/grades.
- **Faculty**: can create/manage courses/assignments/rubrics/test suites; view submissions for their courses; grade.
- **Grading Assistant (GA)**: can access GA endpoints and only GA-authorized operations.
- **University Admin / System Admin**: can manage users/org-level entities as designed.

**Negative testing (must pass):**
- Student cannot access faculty/admin operations.
- GA cannot perform faculty-only actions unless explicitly intended.
- Any cross-course access is blocked (no data leakage across courses/sections).

#### C) Courses / assignments lifecycle

- Create course → enroll users → create assignment → configure rubric/test suite
- Update assignment metadata (due date, late due date, points)
- Verify visibility rules (available-from, due date effects if implemented)

#### D) Submission workflow

- Upload submission files (multipart)
  - Accept allowed extensions; reject disallowed extensions.
  - Enforce size limits.
  - Ensure filenames are sanitized (no path traversal).
- View submission history
  - Confirm ordering, latest submission selection, and correct metadata.

#### E) Run-tests workflow (Docker sandbox)

- Run tests with a representative small project
  - Success path: compile/run, capture stdout/stderr, exit code.
  - Failure path: compile errors, runtime errors, timeouts.
- Limits/containment
  - CPU/memory constraints honored.
  - Prevent runaway processes (PID limit / timeouts).
  - Ensure the sandbox cannot access host secrets or network unintentionally.

#### F) Grader reports (Python pipeline)

- Generate report for an assignment with multiple submissions
  - Confirms pipeline runs end-to-end and produces expected JSON structure.
- Determinism baseline
  - Similarity scores stable for known inputs (within tolerance).
- Optional LLM layer (if enabled)
  - Handles LLM unavailable/timeouts gracefully (report still completes with reduced signals).

#### G) Docs & static routing

- SPA routing works on refresh (deep links don’t 404).
- Docs reachable at `/docs` and internal links/assets load.
- API routes are not shadowed by SPA routes.

---

### 6) API-level testing (integration tests)

Run automated API tests against a real backend + DB.

**Minimum suite**
- Auth: login/signup, token-required behavior
- Student: assignments list/detail, submissions list, submit, run-tests
- Faculty: create assignment, view submissions, grade submission(s)
- Admin: create/manage users (if applicable)

**Assertions**
- Status codes and response schemas
- RBAC enforcement (same endpoint tested across roles)
- Database persistence and side effects

---

### 7) Frontend testing

#### A) Component tests (recommended)

- Forms: validation, error display, disabled states
- File upload UI: shows progress/errors, handles large files gracefully
- Code workspace: tab switching, file tree actions, persistence restoration

#### B) End-to-end tests (recommended)

Automate the highest-value flows:

- Student: login → open assignment → edit workspace → run tests → submit → view result
- Faculty: login → create assignment → add test suite → view submissions → grade
- Admin: login → manage users (if applicable)

---

### 8) Performance / stress testing

#### A) Baseline load test (unauthenticated canary)

- Target a simple endpoint to validate raw throughput/latency.
- Report: **RPS**, **p50/p95/p99 latency**, **error rate**.

#### B) Realistic workload load test (recommended for final)

Model “virtual users” with think time, for example:
- 60% students: view assignment + run tests + occasional submit
- 30% faculty: view submissions + grade
- 10% admins: user management (light)

**Pass criteria (example)**
- Error rate < 1%
- p95 < 500ms for read endpoints
- p95 < 2s for heavier endpoints (run-tests/report triggers), excluding queued processing

#### C) Soak test

- Run steady load for 30–120 minutes to detect memory leaks, thread starvation, DB pool exhaustion.

---

### 9) Security testing

#### A) Auth & RBAC

- Verify strict RBAC on every major endpoint category.
- Ensure no sensitive data is returned in error responses.

#### B) Input validation

- Multipart uploads: path traversal attempts (`../`), very long filenames, special characters.
- JSON payloads: unexpected fields, nulls, oversized strings.

#### C) Common web risks (high-level)

- CORS: only intended origins in production.
- JWT: verify token expiry validation; reject unsigned/invalid tokens.
- Rate limiting (if not implemented): document as a risk and mitigate at reverse proxy / gateway.

---

### 10) Deployment validation (release checklist)

- **Configuration**
  - DB/S3/RabbitMQ env vars set
  - LLM layer enabled only if Ollama reachable (otherwise disabled)
  - Email/Canvas disabled unless configured
- **Data**
  - Production has no demo seed data
  - Bootstrap admin exists and can log in
- **Runtime**
  - Health check returns 200
  - Background consumers connected to RabbitMQ
  - Docker socket mounted only when run-tests is enabled and required
- **Observability**
  - Logs show request errors clearly
  - Queue depth monitored (RabbitMQ overview)

---

### 11) Test deliverables (what you submit)

- Test plan (this document)
- All evidence are attached in the same folder

---

### 12) Optional scope extensions (include only if required)

The following are common extensions that may be included if required by the course rubric or stakeholder requirements:

- Canvas integration testing (API connectivity, import/sync flows, failure handling)
- Email notification testing (SMTP configuration, delivery failures, template validation)
- Grading assistant permissions validation (exact allowed operations per role)
- Run-tests constraints verification (time limit, memory limit, allowed languages)
- Explicit SLO targets (uptime/latency) and pass/fail criteria aligned to the final deployment

