// @ts-nocheck
/**
 * demo/seed.ts — Populate the flat-file stores with a realistic demo
 * student so testers can explore the product immediately after cloning
 * the repo.
 *
 * Run:   npm run demo:seed
 * Reset: npm run demo:reset
 *
 * What gets created:
 *
 *   .data/users.json                     — 1 demo student (Priya Sharma)
 *   .data/student-exam-profiles.json     — 2 exams registered (one 7 days out,
 *                                          one 90 days out — shows Strategy)
 *   .data/plan-templates.json            — 3 saved templates (commute / morning /
 *                                          weekend) showing the Calm promise
 *   .data/session-plans.json             — 6 plans over the past 2 weeks,
 *                                          most with executions (Compounding)
 *   .data/practice-sessions.json         — matching practice-log entries
 *                                          (drives the trailing-stats badge)
 *   demo/demo-token.txt                  — JWT for the demo user
 *   frontend/public/demo.html            — auto-login bootstrap page
 *
 * After seeding, visit http://localhost:3000/demo.html in a browser.
 * The page auto-logs in as the demo student and sends you to the
 * Planned Session surface with the trailing-stats badge already
 * showing some minutes accumulated.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { issueToken } from '../src/auth/jwt';
import { upsertFromGoogle, setRole } from '../src/auth/user-store';
import { upsertProfile } from '../src/session-planner/exam-profile-store';
import { createTemplate } from '../src/session-planner/template-store';
import { savePlan, recordExecution } from '../src/session-planner/store';
import { logPracticeSession } from '../src/session-planner/practice-session-log';
import { planSession, planMultiExamSession } from '../src/session-planner';

// ─── environment ──────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  // The demo doesn't need a production-quality secret — but the JWT
  // issuer insists on something ≥16 chars. Use a stable dev secret so
  // the minted token survives server restarts during testing.
  process.env.JWT_SECRET = 'demo-secret-for-local-testing-only-min-16ch';
  console.log('Note: JWT_SECRET not set, using demo default (OK for local testing).');
}

// Ensure .data/ exists.
if (!existsSync('.data')) mkdirSync('.data', { recursive: true });

// ─── 1. the demo user ─────────────────────────────────────────────────

console.log('\n--- step 1: demo user ---');
const demoUser = upsertFromGoogle({
  google_sub: 'demo-google-sub-0001',
  email: 'priya.demo@vidhya.local',
  name: 'Priya Sharma (demo)',
  picture: '',
});
setRole({ user_id: demoUser.id, new_role: 'student' });
console.log(`  user_id  ${demoUser.id}`);
console.log(`  email    ${demoUser.email}`);
console.log(`  role     student`);

// ─── 2. exam profile ──────────────────────────────────────────────────

console.log('\n--- step 2: exam profile ---');
const today = new Date();
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const daysOut = (n: number) => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + n);
  return fmtDate(d);
};

const profile = upsertProfile(demoUser.id, [
  {
    // Close exam — demonstrates Strategy under time pressure
    exam_id: 'EXM-BITSAT-SAMPLE',
    exam_date: daysOut(7),
    weekly_hours: 10,
    topic_confidence: { algebra: 3, calculus: 2, mechanics: 4 },
    added_at: daysOut(-30),
  },
  {
    // Far exam — demonstrates base-building mode
    exam_id: 'EXM-JEEMAIN-MATH-SAMPLE',
    exam_date: daysOut(90),
    weekly_hours: 8,
    topic_confidence: { algebra: 2, calculus: 2, trigonometry: 3 },
    added_at: daysOut(-15),
  },
]);
console.log(`  exams registered     ${profile.exams.length}`);
console.log(`  closest              ${profile.exams[0].exam_id} (${profile.exams[0].exam_date})`);

// ─── 3. plan templates ────────────────────────────────────────────────

console.log('\n--- step 3: saved templates ---');
const templates = [
  {
    name: 'Morning commute',
    minutes_available: 8,
    exam_id: 'EXM-BITSAT-SAMPLE',
    difficulty: 'medium',
    preset_slug: 'commute-8min',
  },
  {
    name: 'Focused morning',
    minutes_available: 15,
    exam_id: 'EXM-BITSAT-SAMPLE',
    difficulty: 'medium',
    preset_slug: 'morning-15min',
  },
  {
    name: 'Weekend deep dive',
    minutes_available: 60,
    exam_id: 'EXM-JEEMAIN-MATH-SAMPLE',
    difficulty: 'hard',
    preset_slug: 'weekend-60min',
  },
];

for (const t of templates) {
  const created = createTemplate(demoUser.id, {
    name: t.name,
    minutes_available: t.minutes_available,
    exam_id: t.exam_id,
    difficulty: t.difficulty as any,
    preset_slug: t.preset_slug,
  });
  console.log(`  ${created.id}  ${t.name}  (${t.minutes_available} min)`);
}

// ─── 4. plan history with executions ──────────────────────────────────

console.log('\n--- step 4: 6 plans over the last 14 days ---');

// Use the real planner to generate realistic plans.
const planHistory: Array<{ daysAgo: number; minutes: number; multiExam: boolean }> = [
  { daysAgo: 12, minutes: 30, multiExam: false },
  { daysAgo: 9, minutes: 15, multiExam: false },
  { daysAgo: 7, minutes: 60, multiExam: true },
  { daysAgo: 4, minutes: 8, multiExam: false },
  { daysAgo: 2, minutes: 15, multiExam: false },
  { daysAgo: 1, minutes: 8, multiExam: false },
];

let planCount = 0;
let totalMinutesLogged = 0;

for (const h of planHistory) {
  const genTime = new Date(today);
  genTime.setUTCDate(genTime.getUTCDate() - h.daysAgo);

  const plan = h.multiExam
    ? planMultiExamSession({
        student_id: demoUser.id,
        exams: profile.exams.map(e => ({
          exam_id: e.exam_id,
          exam_date: e.exam_date,
          weekly_hours: e.weekly_hours ?? 8,
          topic_confidence: e.topic_confidence ?? {},
        })),
        minutes_available: h.minutes,
        now: genTime,
      })
    : planSession({
        student_id: demoUser.id,
        exam_id: profile.exams[0].exam_id,
        exam_date: profile.exams[0].exam_date,
        minutes_available: h.minutes,
        weekly_hours: 10,
        topic_confidence: profile.exams[0].topic_confidence,
        now: genTime,
      });

  savePlan(plan);

  // Record an execution for each historical plan — simulates student
  // actually completing most of the actions.
  const completionRate = 0.8 + Math.random() * 0.2; // 80-100%
  const completedActions = plan.actions.map((a: any, idx: number) => ({
    action_id: a.id ?? `action_${idx}`,
    completed: Math.random() < completionRate,
    attempts: a.kind === 'practice' ? 2 : undefined,
    correct: a.kind === 'practice' ? 1 : undefined,
    actual_minutes: a.estimated_minutes,
  }));
  const actualMinutes = Math.round(h.minutes * completionRate);

  recordExecution(plan.id, demoUser.id, {
    completed_at: new Date(
      genTime.getTime() + h.minutes * 60 * 1000
    ).toISOString(),
    actual_minutes_spent: actualMinutes,
    actions_completed: completedActions,
  });

  // Mirror into the practice log so the trailing-stats badge has
  // something to count.
  logPracticeSession({
    student_id: demoUser.id,
    minutes: actualMinutes,
    completed_at: new Date(genTime.getTime() + h.minutes * 60 * 1000).toISOString(),
    source: 'plan-execution',
    plan_id: plan.id,
  });

  planCount += 1;
  totalMinutesLogged += actualMinutes;
  console.log(
    `  ${plan.id}  day -${h.daysAgo}  ${h.minutes}min  ` +
    `executed:${actualMinutes}min  actions:${plan.actions.length}` +
    (h.multiExam ? '  [multi-exam]' : '')
  );
}

console.log(`  total: ${planCount} plans / ${totalMinutesLogged} minutes of practice`);

// ─── 5. a few ad-hoc practice entries (not plan-linked) ───────────────

console.log('\n--- step 5: ad-hoc practice entries ---');
const adhoc = [
  { daysAgo: 11, minutes: 5, source: 'smart-practice' as const },
  { daysAgo: 6, minutes: 12, source: 'practice-page' as const },
  { daysAgo: 3, minutes: 7, source: 'smart-practice' as const },
];
for (const e of adhoc) {
  const t = new Date(today);
  t.setUTCDate(t.getUTCDate() - e.daysAgo);
  logPracticeSession({
    student_id: demoUser.id,
    minutes: e.minutes,
    completed_at: t.toISOString(),
    source: e.source,
  });
  console.log(`  day -${e.daysAgo}  ${e.minutes}min  (${e.source})`);
}

// ─── 6. mint a JWT for the demo user ──────────────────────────────────

console.log('\n--- step 6: JWT ---');
const token = issueToken({ user_id: demoUser.id, role: 'student' });
writeFileSync('demo/demo-token.txt', token + '\n');
console.log(`  token written to demo/demo-token.txt`);
console.log(`  first 24 chars: ${token.slice(0, 24)}...`);

// ─── 7. auto-login bootstrap page ─────────────────────────────────────

console.log('\n--- step 7: bootstrap page ---');
const publicDir = 'frontend/public';
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const bootstrapHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vidhya demo — auto-login</title>
  <style>
    body {
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; padding: 24px;
    }
    .card { max-width: 420px; background: #1e293b; border: 1px solid #334155;
            border-radius: 12px; padding: 32px; text-align: center; }
    h1 { margin: 0 0 8px; font-size: 24px; color: #ffffff; }
    p { margin: 0 0 16px; color: #cbd5e1; }
    .check { font-size: 42px; margin-bottom: 16px; color: #10b981; }
    .muted { font-size: 12px; color: #94a3b8; margin-top: 24px; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">✓</div>
    <h1>Demo session starting</h1>
    <p>Signing you in as <strong>Priya Sharma (demo)</strong>…</p>
    <p id="status">Setting up your local session.</p>
    <div class="muted">
      This page sets a JWT in your browser's localStorage and
      redirects to the planned-session surface.<br />
      See <code>DEMO.md</code> for the full walkthrough.
    </div>
  </div>
  <script>
    const TOKEN_KEY = 'vidhya.auth.token.v1';
    const TOKEN = ${JSON.stringify(token)};
    try {
      localStorage.setItem(TOKEN_KEY, TOKEN);
    } catch (e) {
      document.getElementById('status').textContent =
        'Could not set localStorage. Are cookies / storage disabled?';
      throw e;
    }
    // Give the eye a beat, then jump in.
    setTimeout(() => {
      window.location = '/gate/planned';
    }, 600);
  </script>
</body>
</html>
`;
writeFileSync('frontend/public/demo.html', bootstrapHtml);
console.log(`  frontend/public/demo.html written`);

// ─── summary ──────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('Demo seed complete.');
console.log('═'.repeat(60));
console.log('');
console.log('To start the demo:');
console.log('  1. Start the backend:   npm run dev:server');
console.log('  2. Start the frontend:  cd frontend && npm run dev');
console.log('  3. Open:                http://localhost:3000/demo.html');
console.log('');
console.log('Or run both at once:');
console.log('  npm run demo:start');
console.log('');
console.log('To reset the demo:');
console.log('  npm run demo:reset');
console.log('');
