# URLs in this manual

Paths match the Grade-Forge web app after you sign in. For the **University of Louisiana Monroe** deployment, your address bar looks like:

**[https://ulm.gradeforge.tech](https://ulm.gradeforge.tech)** + path (for example `/assignment/12`).

If your school runs a different host, swap the origin; the path part stays the same.

**Example URLs** in this manual use **[https://ulm.gradeforge.tech](https://ulm.gradeforge.tech)** plus sample numbers such as `4` or `12`. Those numbers are placeholders: use the course, class, assignment, and submission ids from your own account.

We never use `localhost` here. The same paths work in production and in local development; only the origin changes.

**Path:** always shown for in-app tasks (placeholders in `{curlyBraces}` mean “your id here”).

**Example URL:** shown when a full link makes the page easier to read.

## Regenerating screenshots

PNG files for the manual live in the repo under `public/manual/images/` (relative to `docs-site/`). Use Playwright from `docs-site/`: run `npm run docs:capture-screenshots:install` once, then `npm run docs:capture-screenshots`.

**Deployed app:** the capture script defaults to [https://ulm.gradeforge.tech](https://ulm.gradeforge.tech) for app routes.

**Local dev (no public host):** run Spring on port 8080 and the Client dev server on 5173 (Vite proxies `/docs` to the server). Set one origin for both app and manual pages:

`SCREENSHOT_BASE_URL=http://127.0.0.1:5173`

**Manual-only (VitePress preview):** `npm run docs:capture-screenshots:full` builds the manual and captures `/docs/*` from a temporary preview on port 4173. You can combine that with `SCREENSHOT_BASE_URL` or `SCREENSHOT_APP_BASE_URL` in the same shell so public app shots still hit your local Vite.

**Signed-in pages:** set `SCREENSHOT_AUTH_EMAIL`, `SCREENSHOT_AUTH_PASSWORD`, and comma-separated `SCREENSHOT_AUTH_PATHS`. Each path is tried in order; routes that are missing or error are skipped without stopping the run. Copy `docs-site/.env.screenshots.example` to `docs-site/.env.screenshots` (gitignored) and fill values there. **Do not commit real passwords or put them in the user manual.**

Details: `docs-site/scripts/capture-manual-screenshots.mjs`.
