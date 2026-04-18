#!/usr/bin/env node
/**
 * Capture PNG screenshots for the user manual (docs-site/public/manual/images/).
 *
 * Optional secrets: copy `.env.screenshots.example` to `.env.screenshots` (gitignored)
 * and set SCREENSHOT_AUTH_* there. Never commit passwords.
 *
 * **One origin for everything (typical local dev):** Client on 5173 with Spring on 8080
 * so `/docs` is proxied to static manual:
 *
 *   SCREENSHOT_BASE_URL=http://127.0.0.1:5173 npm run docs:capture-screenshots
 *
 * **Split origins:** `SCREENSHOT_APP_BASE_URL` and optional `SCREENSHOT_DOCS_BASE_URL`.
 * If docs base is unset, `/docs/*` shots are skipped unless `SCREENSHOT_BASE_URL` is set.
 *
 * **Manual-only preview:** `npm run docs:build && npm run docs:preview -- --port 4173`
 * then `SCREENSHOT_DOCS_BASE_URL=http://127.0.0.1:4173` (app pages still need an app URL).
 *
 * **Authenticated pages:** `SCREENSHOT_AUTH_EMAIL`, `SCREENSHOT_AUTH_PASSWORD`,
 * `SCREENSHOT_AUTH_PATHS` (comma-separated). Each path is best-effort if your stack
 * is not fully up or data is missing.
 *
 * First time (Chromium): npm run docs:capture-screenshots:install
 */

import { readFileSync } from "fs";
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadOptionalEnvFile() {
  const p = join(__dirname, "..", ".env.screenshots");
  try {
    const text = readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* missing file is fine */
  }
}

loadOptionalEnvFile();

const UNIFIED = process.env.SCREENSHOT_BASE_URL?.replace(/\/$/, "") || "";
const APP_BASE = (
  UNIFIED ||
  process.env.SCREENSHOT_APP_BASE_URL ||
  "https://gradeforge.tech"
).replace(/\/$/, "");
const DOCS_BASE = (UNIFIED || process.env.SCREENSHOT_DOCS_BASE_URL || "").replace(/\/$/, "");
const OUT_DIR =
  process.env.SCREENSHOT_OUT_DIR || join(__dirname, "..", "public", "manual", "images");
const VIEWPORT = { width: 1280, height: 800 };

const APP_PAGES = [
  { slug: "landing", path: "/" },
  { slug: "signin", path: "/signin" },
  { slug: "signup", path: "/signup" },
];

const DOCS_PAGES = [
  { slug: "docs-home", path: "/docs/" },
  { slug: "manual-overview", path: "/docs/manual/overview" },
  { slug: "manual-actions", path: "/docs/manual/actions/" },
  { slug: "manual-faq", path: "/docs/manual/faq" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capturePage(page, slug, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(1500);
    const file = join(OUT_DIR, `${slug}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Wrote ${file}`);
  } catch (err) {
    console.warn(`Skip ${url} (${slug}):`, err.message);
  }
}

async function loginAndCapture(browser) {
  const email = process.env.SCREENSHOT_AUTH_EMAIL;
  const password = process.env.SCREENSHOT_AUTH_PASSWORD;
  if (!email || !password) {
    console.log(
      "Skipping authenticated shots (set SCREENSHOT_AUTH_EMAIL and SCREENSHOT_AUTH_PASSWORD in the environment or .env.screenshots).",
    );
    return;
  }

  const paths = (process.env.SCREENSHOT_AUTH_PATHS || "/dashboard,/settings")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    await page.goto(`${APP_BASE}/signin`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.endsWith("/signin"), { timeout: 90000 });

    for (const p of paths) {
      const path = p.startsWith("/") ? p : `/${p}`;
      const inner = path.replace(/^\//, "").replace(/\//g, "-") || "root";
      const slug = `auth-${inner}`;
      await capturePage(page, slug, `${APP_BASE}${path}`);
    }
  } catch (err) {
    console.error("Authenticated capture failed:", err.message);
    try {
      await page.screenshot({ path: join(OUT_DIR, "auth-error.png"), fullPage: true });
      console.log(`Saved failure snapshot: ${join(OUT_DIR, "auth-error.png")}`);
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`App screenshots: ${APP_BASE}`);
  if (DOCS_BASE) console.log(`Docs screenshots: ${DOCS_BASE}`);
  else if (!UNIFIED)
    console.log(
      "Docs screenshots skipped (set SCREENSHOT_BASE_URL for local Vite+Spring, or SCREENSHOT_DOCS_BASE_URL for VitePress preview).",
    );

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    for (const { slug, path } of APP_PAGES) {
      await capturePage(page, slug, `${APP_BASE}${path}`);
    }

    if (DOCS_BASE) {
      for (const { slug, path } of DOCS_PAGES) {
        await capturePage(page, slug, `${DOCS_BASE}${path}`);
      }
    }

    await context.close();
    await loginAndCapture(browser);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
