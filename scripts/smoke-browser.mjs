/**
 * Production smoke: does the deployed app actually RENDER in a real browser?
 *
 * The sibling checks in `prod-smoke.yml` are HTTP-level. They prove routes
 * answer and payloads have the right shape, and they would all pass against a
 * build whose JavaScript throws on load — because a broken bundle still
 * returns `<!doctype html>` with HTTP 200. A student would see a blank page
 * and every check would be green.
 *
 * This loads the app in headless Chromium and fails on a page error, an
 * unhandled rejection, or a body that never gets any content into it. It is
 * deliberately shallow: it does not click through flows or assert on copy,
 * because a smoke test that mirrors the UI in detail breaks on every design
 * change and gets muted. It answers one question — does the thing come up.
 *
 * Usage:  node scripts/smoke-browser.mjs <base-url>
 *
 * Chromium: CI runs `playwright install chromium`, which fetches the build
 * matching the installed Playwright and needs no configuration. Set
 * SMOKE_CHROMIUM_PATH to run against a Chromium that is already on the
 * machine — a sandbox with a preinstalled browser, or a local reproduction of
 * a CI failure — since Playwright refuses a build it did not install itself
 * and the error it gives ("Executable doesn't exist") reads like a missing
 * dependency rather than a version mismatch.
 */

import { chromium } from 'playwright';

const BASE = (process.argv[2] || 'https://vidhya-demo.onrender.com').replace(/\/+$/, '');
/** Phone first: the product is mobile-first, so this is the real viewport. */
const VIEWPORT = { width: 390, height: 844 };
const NAV_TIMEOUT_MS = 60_000;

/**
 * Errors that are the page's own fault vs. noise from the environment.
 * Third-party/network noise (an analytics beacon, a font CDN) must not fail a
 * deploy — only errors thrown by the app itself.
 */
function isAppError(text) {
  return !/favicon|analytics|gtag|net::ERR_(BLOCKED|ABORTED)/i.test(text);
}

const failures = [];
const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  ...(process.env.SMOKE_CHROMIUM_PATH ? { executablePath: process.env.SMOKE_CHROMIUM_PATH } : {}),
});
const ctx = await browser.newContext({ viewport: VIEWPORT });
const page = await ctx.newPage();

const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e?.message ?? e)));
page.on('console', (m) => {
  if (m.type() === 'error' && isAppError(m.text())) pageErrors.push(`console: ${m.text()}`);
});

try {
  const res = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  if (!res || res.status() >= 400) {
    failures.push(`GET / returned ${res ? res.status() : 'no response'}`);
  }

  // The SPA mounts asynchronously; wait for it to put something on screen
  // rather than sleeping a fixed interval and hoping.
  await page
    .waitForFunction(() => (document.body?.innerText ?? '').trim().length > 40, { timeout: 30_000 })
    .catch(() => {
      failures.push('the app rendered no visible text — the bundle likely failed to boot');
    });

  const text = await page.evaluate(() => (document.body?.innerText ?? '').trim());
  console.log(`[smoke-browser] ${BASE} rendered ${text.length} chars at ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`[smoke-browser] first line: ${text.split('\n')[0] ?? '(none)'}`);

  const appErrors = pageErrors.filter(isAppError);
  if (appErrors.length > 0) {
    failures.push(`the page threw ${appErrors.length} error(s): ${appErrors.slice(0, 3).join(' | ')}`);
  }
} catch (err) {
  failures.push(`navigation crashed: ${err?.message ?? err}`);
} finally {
  await browser.close();
}

for (const f of failures) console.log(`::error::${f}`);
if (failures.length > 0) {
  console.error('[smoke-browser] FAILED — the deployed app does not come up in a real browser');
  process.exit(1);
}
console.log('[smoke-browser] OK — the app boots and renders, no page errors');
