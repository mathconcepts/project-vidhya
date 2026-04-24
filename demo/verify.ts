// @ts-nocheck
/**
 * demo/verify.ts — automated end-to-end smoke test for the demo.
 *
 * Confirms that after running `npm run demo:seed`, the seeded data is
 * actually queryable through the real HTTP routes using the real JWT.
 * No browser needed.
 *
 * Preconditions:
 *   - npm run demo:seed has been run
 *   - The backend is listening on port 8080 with JWT_SECRET set to
 *     match demo/seed.ts's default
 *
 * Run: npm run demo:verify
 */

import { readFileSync, existsSync } from 'fs';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:8080';

function must<T>(cond: T, msg: string): T {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    process.exit(1);
  }
  return cond;
}

async function main() {
  console.log('Demo verification\n');

  // Check token file exists.
  must(
    existsSync('demo/demo-token.txt'),
    'demo/demo-token.txt is missing — run `npm run demo:seed` first'
  );
  const token = readFileSync('demo/demo-token.txt', 'utf-8').trim();
  console.log(`  ✓ token loaded (${token.length} chars)`);

  // Check backend is reachable.
  try {
    const health = await fetch(`${BASE}/health`);
    must(
      health.status === 200,
      `backend /health returned ${health.status} — is the server running?`
    );
  } catch (e: any) {
    console.error(`  ✗ cannot reach ${BASE}: ${e.message}`);
    console.error(`    start the backend with: npm run dev:server`);
    process.exit(1);
  }
  console.log(`  ✓ backend reachable at ${BASE}`);

  const headers = { Authorization: `Bearer ${token}` };

  // [1] Exam profile has 2 exams.
  {
    const r = await fetch(`${BASE}/api/student/profile`, { headers });
    must(r.status === 200, `/api/student/profile returned ${r.status}`);
    const body = await r.json();
    must(
      Array.isArray(body.exams) && body.exams.length === 2,
      `expected 2 registered exams, got ${body.exams?.length ?? 'undefined'}`
    );
    console.log(`  ✓ exam profile: ${body.exams.length} exams registered`);
    console.log(`      closest exam: ${body.exams[0].exam_id} (${body.exams[0].exam_date})`);
  }

  // [2] Templates — should have 3.
  {
    const r = await fetch(`${BASE}/api/student/session/templates`, { headers });
    must(r.status === 200, `templates list returned ${r.status}`);
    const body = await r.json();
    must(
      Array.isArray(body.templates) && body.templates.length === 3,
      `expected 3 templates, got ${body.templates?.length ?? 'undefined'}`
    );
    console.log(`  ✓ templates: ${body.templates.length} saved`);
    for (const t of body.templates) {
      console.log(`      ${t.name}  (${t.minutes_available} min)`);
    }
  }

  // [3] Trailing stats — should have > 0 minutes.
  {
    const r = await fetch(`${BASE}/api/student/session/trailing-stats`, { headers });
    must(r.status === 200, `trailing-stats returned ${r.status}`);
    const body = await r.json();
    must(
      body.trailing_7d_minutes > 0,
      `expected trailing_7d_minutes > 0, got ${body.trailing_7d_minutes}`
    );
    console.log(
      `  ✓ trailing stats: ${body.trailing_7d_minutes} min across ${body.trailing_7d_sessions} sessions`
    );
  }

  // [4] Plan list — should have plans.
  {
    const r = await fetch(`${BASE}/api/student/session/plans`, { headers });
    must(r.status === 200, `plan list returned ${r.status}`);
    const body = await r.json();
    must(
      Array.isArray(body.plans) && body.plans.length > 0,
      `expected plans, got ${body.plans?.length ?? 'undefined'}`
    );
    console.log(`  ✓ plan history: ${body.plans.length} plans`);
  }

  // [5] Live plan generation — the real planner answers.
  {
    const r = await fetch(`${BASE}/api/student/session/plan`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_id: 'EXM-BITSAT-SAMPLE',
        exam_date: new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10),
        minutes_available: 15,
      }),
    });
    must(r.status === 200, `live plan generation returned ${r.status}`);
    const plan = await r.json();
    must(
      plan && Array.isArray(plan.actions),
      `plan response missing .actions`
    );
    console.log(
      `  ✓ live plan: ${plan.actions.length} actions, ${plan.total_estimated_minutes ?? '?'} min budgeted`
    );
  }

  // [6] Presets — GET returns the 5-preset catalog.
  {
    const r = await fetch(`${BASE}/api/student/session/templates/presets`, { headers });
    must(r.status === 200, `presets returned ${r.status}`);
    const body = await r.json();
    must(
      Array.isArray(body.presets) && body.presets.length >= 5,
      `expected ≥5 presets, got ${body.presets?.length}`
    );
    console.log(`  ✓ preset catalog: ${body.presets.length} presets available`);
    const adopted = body.presets.filter((p: any) => p.adopted).length;
    console.log(`      ${adopted} already adopted as templates`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('All 6 demo-verification checks passed.');
  console.log('The demo is working end-to-end.');
  console.log('═'.repeat(60));
}

main().catch(e => {
  console.error('\nFAIL:', e.message);
  console.error(e.stack?.split('\n').slice(0, 3).join('\n'));
  process.exit(1);
});
