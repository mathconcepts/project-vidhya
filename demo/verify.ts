// @ts-nocheck
/**
 * demo/verify.ts — automated end-to-end smoke for the multi-role demo.
 *
 * Probes role-specific endpoints for every seeded role using the real
 * JWTs and asserts the data matches what the seed wrote.
 *
 * Preconditions:
 *   - npm run demo:seed has been run
 *   - Backend listening on :8080 with matching JWT_SECRET
 */

import { readFileSync, existsSync } from 'fs';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:8080';

let passCount = 0;
let failCount = 0;

function pass(msg: string): void { console.log(`  ✓ ${msg}`); passCount += 1; }
function fail(msg: string): void { console.error(`  ✗ ${msg}`); failCount += 1; }

async function main() {
  console.log('\nMulti-role demo verification\n');

  if (!existsSync('demo/demo-tokens.json')) {
    fail('demo/demo-tokens.json missing — run `npm run demo:seed` first');
    process.exit(1);
  }
  const tokens = JSON.parse(readFileSync('demo/demo-tokens.json', 'utf-8'));
  pass(`tokens loaded: ${Object.keys(tokens).join(', ')}`);

  try {
    const h = await fetch(`${BASE}/health`);
    if (h.status !== 200) { fail(`/health returned ${h.status}`); process.exit(1); }
  } catch (e: any) {
    fail(`cannot reach ${BASE}: ${e.message}`);
    console.error(`    run:  npm run dev:server`);
    process.exit(1);
  }
  pass(`backend reachable at ${BASE}`);

  const H = (role: string) => ({ Authorization: `Bearer ${tokens[role].token}` });

  console.log('\n── owner ────────────────────────────────────────────');
  {
    const r = await fetch(`${BASE}/api/admin/users`, { headers: H('owner') });
    if (r.status === 200) {
      const body = await r.json();
      const users = body.users ?? body;
      if (Array.isArray(users) && users.length >= 6) pass(`owner lists ${users.length} users`);
      else fail(`owner user list count: ${Array.isArray(users) ? users.length : 'non-array'}`);
    } else fail(`owner /api/admin/users returned ${r.status}`);
  }

  console.log('\n── admin ────────────────────────────────────────────');
  {
    const r = await fetch(`${BASE}/api/admin/users`, { headers: H('admin') });
    if (r.status === 200) pass(`admin can list users`);
    else fail(`admin /api/admin/users returned ${r.status}`);
  }
  {
    const r = await fetch(`${BASE}/api/admin/dashboard-summary`, { headers: H('admin') });
    if (r.status === 200) pass(`admin can fetch dashboard summary`);
    else fail(`admin dashboard-summary returned ${r.status}`);
  }

  console.log('\n── teacher ──────────────────────────────────────────');
  {
    const r = await fetch(`${BASE}/api/teacher/roster`, { headers: H('teacher') });
    if (r.status === 200) {
      const body = await r.json();
      const roster = body.students ?? body.roster ?? body;
      const count = Array.isArray(roster) ? roster.length : 0;
      if (count >= 2) pass(`teacher roster: ${count} students`);
      else fail(`teacher roster has ${count} students (expected ≥ 2)`);
    } else fail(`teacher /api/teacher/roster returned ${r.status}`);
  }

  console.log('\n── student · active (Priya) ─────────────────────────');
  {
    const r = await fetch(`${BASE}/api/student/profile`, { headers: H('student-active') });
    const body = await r.json();
    if (r.status === 200 && body.exams?.length === 2) pass(`Priya: 2 registered exams`);
    else fail(`Priya profile: ${JSON.stringify(body).slice(0,80)}`);
  }
  {
    const r = await fetch(`${BASE}/api/student/session/trailing-stats`, { headers: H('student-active') });
    const body = await r.json();
    if (r.status === 200 && body.trailing_7d_minutes > 0) {
      pass(`Priya trailing stats: ${body.trailing_7d_minutes} min / ${body.trailing_7d_sessions} sessions`);
    } else fail(`Priya trailing stats: ${JSON.stringify(body).slice(0,80)}`);
  }
  {
    const r = await fetch(`${BASE}/api/student/session/templates`, { headers: H('student-active') });
    const body = await r.json();
    if (r.status === 200 && body.templates?.length === 3) pass(`Priya: 3 saved templates`);
    else fail(`Priya templates count: ${body.templates?.length ?? '?'}`);
  }
  {
    const r = await fetch(`${BASE}/api/student/session/plan`, {
      method: 'POST',
      headers: { ...H('student-active'), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_id: 'EXM-BITSAT-MATH-SAMPLE',
        exam_date: new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10),
        minutes_available: 15,
      }),
    });
    const plan = await r.json();
    if (r.status === 200 && Array.isArray(plan.actions)) {
      pass(`Priya live plan: ${plan.actions.length} actions, ${plan.total_estimated_minutes} min`);
    } else fail(`Priya live plan: ${JSON.stringify(plan).slice(0,80)}`);
  }

  console.log('\n── student · light (Rahul) ──────────────────────────');
  {
    const r = await fetch(`${BASE}/api/student/profile`, { headers: H('student-light') });
    const body = await r.json();
    if (r.status === 200 && body.exams?.length === 1) pass(`Rahul: 1 registered exam`);
    else fail(`Rahul profile: ${JSON.stringify(body).slice(0,80)}`);
  }
  {
    const r = await fetch(`${BASE}/api/student/session/plans`, { headers: H('student-light') });
    const body = await r.json();
    if (r.status === 200 && body.plans?.length === 2) pass(`Rahul: 2 plans in history`);
    else fail(`Rahul plans: got ${body.plans?.length ?? '?'}`);
  }

  console.log('\n── student · new (Aditya) ───────────────────────────');
  {
    const r = await fetch(`${BASE}/api/student/profile`, { headers: H('student-new') });
    if (r.status === 200) {
      const body = await r.json();
      if (!body.exams || body.exams.length === 0) pass(`Aditya: empty profile (first-time-UX)`);
      else fail(`Aditya unexpectedly has ${body.exams.length} exams`);
    } else if (r.status === 404) {
      pass(`Aditya: no profile (404 — first-time-UX)`);
    } else fail(`Aditya profile returned ${r.status}`);
  }

  console.log('\n── demo telemetry ───────────────────────────────────');
  {
    const { summariseDemoLog } = await import('./telemetry');
    const s = summariseDemoLog();
    if (s.total >= 10) pass(`demo log: ${s.total} events across ${Object.keys(s.by_role).length} roles`);
    else fail(`demo log thin: ${s.total} events`);
  }

  console.log('\n' + '═'.repeat(60));
  if (failCount === 0) {
    console.log(`All ${passCount} checks passed. Multi-role demo working end-to-end.`);
  } else {
    console.log(`${passCount} passed · ${failCount} FAILED`);
  }
  console.log('═'.repeat(60) + '\n');
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('\nUNEXPECTED FAIL:', e.message);
  console.error(e.stack?.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
});
