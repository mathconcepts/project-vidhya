// @ts-nocheck
/**
 * Regenerate the static dashboard AND docs HTML files from their TS templates.
 *
 * The canonical sources are:
 *   src/admin-orchestrator/dashboard-html.ts  →  getDashboardHTML()
 *   src/admin-orchestrator/docs-html.ts       →  getDocsHTML()
 *
 * This script writes each output to TWO locations:
 *
 *   frontend/public/admin/agent/<name>/index.html
 *     — picked up by Vite's public-folder copy at build time;
 *       ends up in frontend/dist/ after `npm run build`
 *
 *   frontend/dist/admin/agent/<name>/index.html
 *     — written directly so local development against an existing
 *       frontend/dist works without rebuilding the full SPA
 *
 * Run after any change to dashboard-html.ts or docs-html.ts:
 *
 *     npx tsx scripts/regenerate-dashboard-static.ts
 *
 * Generated files ARE committed to the repo. Treat them as derived
 * artifacts — never edit by hand. If the TS source and the committed
 * HTML ever diverge, re-run this script.
 *
 * Artifacts managed:
 *   /admin/agent/dashboard  (v2.25.0+) — operations control-room
 *   /admin/agent/docs       (v2.29.0+) — Swagger UI over the OpenAPI 3.1 spec
 */

import fs from 'fs';
import path from 'path';

async function main(): Promise<void> {
  const { getDashboardHTML } = await import('../src/admin-orchestrator/dashboard-html');
  const { getDocsHTML } = await import('../src/admin-orchestrator/docs-html');

  // Map of route-path → HTML generator
  const artifacts: Array<{ route: string; html: string }> = [
    { route: 'admin/agent/dashboard', html: getDashboardHTML() },
    { route: 'admin/agent/docs',      html: getDocsHTML() },
  ];

  const distRoot = path.resolve(process.cwd(), 'frontend/dist');
  const hasDist = fs.existsSync(distRoot);

  let written = 0;
  for (const { route, html } of artifacts) {
    const targets = [
      path.resolve(process.cwd(), `frontend/public/${route}/index.html`),
    ];
    if (hasDist) {
      targets.push(path.resolve(process.cwd(), `frontend/dist/${route}/index.html`));
    } else {
      console.log(`[skip] frontend/dist/${route}/index.html — frontend/dist not present`);
    }

    for (const t of targets) {
      fs.mkdirSync(path.dirname(t), { recursive: true });
      fs.writeFileSync(t, html, 'utf8');
      console.log(`[wrote ${html.length} bytes] ${t}`);
      written++;
    }
  }
  console.log(`Regenerated ${written} target(s) across ${artifacts.length} artifact(s).`);
}

main().catch((err) => {
  console.error('regenerate-dashboard-static failed:', err);
  process.exit(1);
});
