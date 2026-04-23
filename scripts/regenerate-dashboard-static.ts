// @ts-nocheck
/**
 * Regenerate the static dashboard HTML file from its TS template.
 *
 * The canonical source is src/admin-orchestrator/dashboard-html.ts. This
 * script writes the getDashboardHTML() output to TWO locations:
 *
 *   frontend/public/admin/agent/dashboard/index.html
 *     — picked up by Vite's public-folder copy at build time;
 *       ends up in frontend/dist/ after `npm run build`
 *
 *   frontend/dist/admin/agent/dashboard/index.html
 *     — written directly so local development against an existing
 *       frontend/dist works without rebuilding the full SPA
 *
 * Run after any change to dashboard-html.ts:
 *
 *     npx tsx scripts/regenerate-dashboard-static.ts
 *
 * The generated file IS committed to the repo. Treat it as a derived
 * artifact — never edit by hand. If the TS source and the committed
 * HTML ever diverge, re-run this script.
 */

import fs from 'fs';
import path from 'path';

async function main(): Promise<void> {
  const { getDashboardHTML } = await import('../src/admin-orchestrator/dashboard-html');
  const html = getDashboardHTML();

  const targets = [
    path.resolve(process.cwd(), 'frontend/public/admin/agent/dashboard/index.html'),
    path.resolve(process.cwd(), 'frontend/dist/admin/agent/dashboard/index.html'),
  ];

  let written = 0;
  for (const t of targets) {
    const dir = path.dirname(t);
    // Only write dist if the dist directory exists (skip gracefully in dev
    // environments that haven't run `npm run build` yet).
    if (t.includes('/dist/') && !fs.existsSync(path.resolve(process.cwd(), 'frontend/dist'))) {
      console.log(`[skip] ${t} — frontend/dist not present`);
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(t, html, 'utf8');
    console.log(`[wrote ${html.length} bytes] ${t}`);
    written++;
  }
  console.log(`Regenerated ${written} target(s).`);
}

main().catch((err) => {
  console.error('regenerate-dashboard-static failed:', err);
  process.exit(1);
});
