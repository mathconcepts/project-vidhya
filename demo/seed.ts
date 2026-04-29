// @ts-nocheck
/**
 * demo/seed.ts — populate flat-file stores with realistic demo data for
 * all four roles: owner, admin, teacher, student.
 *
 * Run:    npm run demo:seed
 * Reset:  npm run demo:reset
 * Verify: npm run demo:verify
 *
 * Creates:
 *   1 owner     — Nisha Rao            — manages the whole platform
 *   1 admin     — Arjun Gupta          — runs content + campaigns
 *   1 teacher   — Kavita Menon         — teaches 2 of the 3 students
 *   3 students  — Priya  (active; taught by Kavita; 2 exams, 6 plans, trailing stats)
 *                 Rahul  (light;  taught by Kavita; 1 exam, 2 plans)
 *                 Aditya (new;    no teacher; no data — first-time UX)
 *
 * Each user gets a JWT. A role-picker landing page lets testers pick
 * with one click.
 *
 * Dependencies exposed — see DEMO.md:
 *   - Hosting:    local by default; Render/Railway/Fly guides in demo/HOSTING.md
 *   - API keys:   BYOK via /gate/llm-config. Matrix in demo/API-KEYS.md.
 *   - Telemetry:  .data/demo-usage-log.json — owner-visible.
 */

import { writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { issueToken } from '../src/auth/jwt';
import {
  upsertFromGoogle,
  setRole,
  assignTeacher,
  transferOwnership,
} from '../src/auth/user-store';
import { upsertProfile } from '../src/session-planner/exam-profile-store';
import { createTemplate } from '../src/session-planner/template-store';
import { savePlan, recordExecution } from '../src/session-planner/store';
import { logPracticeSession } from '../src/session-planner/practice-session-log';
import { planSession, planMultiExamSession } from '../src/session-planner';
import { logDemoEvent, clearDemoLog } from './telemetry';

// ─── environment ──────────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'demo-secret-for-local-testing-only-min-16ch';
  console.log('Note: JWT_SECRET not set, using demo default (OK for local testing).');
}

// Honour the auth.demo_seed feature flag — production deployments
// where the demo personas would confuse real users can disable seeding
// by setting VIDHYA_AUTH_DEMO_SEED=0. Use top-level await for the
// dynamic import (tsx + Node 22 in ESM mode supports it).
{
  const { isAuthFeatureEnabled } = await import('../src/modules/auth/feature-flags');
  if (!isAuthFeatureEnabled('auth.demo_seed')) {
    console.log('');
    console.log('Demo seed is disabled on this deployment (auth.demo_seed=off).');
    console.log('Set VIDHYA_AUTH_DEMO_SEED=1 to enable, or run with the demo profile.');
    console.log('No users were created.');
    process.exit(0);
  }
}

if (!existsSync('.data')) mkdirSync('.data', { recursive: true });

clearDemoLog();
logDemoEvent({ role: 'unknown', user_id: null, event: 'seed.started' });

// ─── 1. the owner ─────────────────────────────────────────────────────

console.log('\n--- step 1: owner ---');
const ownerUser = upsertFromGoogle({
  google_sub: 'demo-owner-0001',
  email: 'nisha.demo@vidhya.local',
  name: 'Nisha Rao (demo owner)',
  picture: '',
});
console.log(`  user_id  ${ownerUser.id}`);
console.log(`  role     ${ownerUser.role} (auto-assigned as first user)`);
if (ownerUser.role !== 'owner') {
  const result = transferOwnership({ actor_id: ownerUser.id, new_owner_id: ownerUser.id });
  if (!result?.ok) {
    console.log(`  note: could not elevate (${result?.reason ?? 'unknown'})`);
  }
}
logDemoEvent({ role: 'owner', user_id: ownerUser.id, event: 'seed.user-created' });

// ─── 2. the admin ─────────────────────────────────────────────────────

console.log('\n--- step 2: admin ---');
const adminUser = upsertFromGoogle({
  google_sub: 'demo-admin-0002',
  email: 'arjun.demo@vidhya.local',
  name: 'Arjun Gupta (demo admin)',
  picture: '',
});
const adminPromo = setRole({ actor_id: ownerUser.id, target_id: adminUser.id, new_role: 'admin' });
console.log(`  user_id  ${adminUser.id}`);
console.log(`  role     ${adminPromo?.user?.role ?? adminUser.role}`);
logDemoEvent({ role: 'admin', user_id: adminUser.id, event: 'seed.user-created' });

// ─── 3. the teacher ───────────────────────────────────────────────────

console.log('\n--- step 3: teacher ---');
const teacherUser = upsertFromGoogle({
  google_sub: 'demo-teacher-0003',
  email: 'kavita.demo@vidhya.local',
  name: 'Kavita Menon (demo teacher)',
  picture: '',
});
const teacherPromo = setRole({ actor_id: adminUser.id, target_id: teacherUser.id, new_role: 'teacher' });
console.log(`  user_id  ${teacherUser.id}`);
console.log(`  role     ${teacherPromo?.user?.role ?? teacherUser.role}`);
logDemoEvent({ role: 'teacher', user_id: teacherUser.id, event: 'seed.user-created' });

// ─── 4. the students ──────────────────────────────────────────────────

console.log('\n--- step 4: three students ---');
const students = [
  { google_sub: 'demo-student-priya',  email: 'priya.demo@vidhya.local',  name: 'Priya Sharma (demo · active)', assignToTeacher: true,  pattern: 'active' },
  { google_sub: 'demo-student-rahul',  email: 'rahul.demo@vidhya.local',  name: 'Rahul Iyer (demo · light)',    assignToTeacher: true,  pattern: 'light'  },
  { google_sub: 'demo-student-aditya', email: 'aditya.demo@vidhya.local', name: 'Aditya Shah (demo · new)',     assignToTeacher: false, pattern: 'empty'  },
];
const studentUsers: Array<{ user: any; pattern: string }> = [];

for (const s of students) {
  const u = upsertFromGoogle({ google_sub: s.google_sub, email: s.email, name: s.name, picture: '' });
  setRole({ actor_id: ownerUser.id, target_id: u.id, new_role: 'student' });
  if (s.assignToTeacher) {
    assignTeacher({ actor_id: adminUser.id, student_id: u.id, teacher_id: teacherUser.id });
  }
  studentUsers.push({ user: u, pattern: s.pattern });
  console.log(`  ${u.id}  ${s.name}${s.assignToTeacher ? '  [taught by Kavita]' : ''}`);
  logDemoEvent({ role: 'student', user_id: u.id, event: 'seed.user-created', detail: { pattern: s.pattern } });
}

const today = new Date();
const daysOut = (n: number) => {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const activeStudent = studentUsers.find(s => s.pattern === 'active')!.user;
const lightStudent  = studentUsers.find(s => s.pattern === 'light')!.user;

// ─── 5. exam profiles ─────────────────────────────────────────────────

console.log('\n--- step 5: exam profiles ---');
upsertProfile(activeStudent.id, [
  { exam_id: 'EXM-BITSAT-MATH-SAMPLE',       exam_date: daysOut(7),  weekly_hours: 10, topic_confidence: { algebra: 3, calculus: 2, mechanics: 4 }, added_at: daysOut(-30) },
  { exam_id: 'EXM-JEEMAIN-MATH-SAMPLE', exam_date: daysOut(90), weekly_hours: 8,  topic_confidence: { algebra: 2, calculus: 2, trigonometry: 3 }, added_at: daysOut(-15) },
]);
upsertProfile(lightStudent.id, [
  { exam_id: 'EXM-BITSAT-MATH-SAMPLE', exam_date: daysOut(30), weekly_hours: 6, topic_confidence: { algebra: 2, calculus: 1 }, added_at: daysOut(-7) },
]);
console.log(`  Priya  (active): 2 exams (7d + 90d out)`);
console.log(`  Rahul  (light):  1 exam (30d out)`);
console.log(`  Aditya (new):    0 exams (intentional)`);

// ─── 6. Priya's templates ─────────────────────────────────────────────

console.log('\n--- step 6: Priya\'s saved templates ---');
for (const t of [
  { name: 'Morning commute',   minutes_available: 8,  exam_id: 'EXM-BITSAT-MATH-SAMPLE',       difficulty: 'medium', preset_slug: 'commute-8min'  },
  { name: 'Focused morning',   minutes_available: 15, exam_id: 'EXM-BITSAT-MATH-SAMPLE',       difficulty: 'medium', preset_slug: 'morning-15min' },
  { name: 'Weekend deep dive', minutes_available: 60, exam_id: 'EXM-JEEMAIN-MATH-SAMPLE', difficulty: 'hard',   preset_slug: 'weekend-60min' },
]) {
  const created = createTemplate(activeStudent.id, {
    name: t.name, minutes_available: t.minutes_available,
    exam_id: t.exam_id, difficulty: t.difficulty as any, preset_slug: t.preset_slug,
  });
  console.log(`  ${created.id}  ${t.name}`);
}

// ─── 7. plan history ──────────────────────────────────────────────────

console.log('\n--- step 7: plan history + practice log ---');

async function seedPriyaHistory() {
  const profile = [
    { exam_id: 'EXM-BITSAT-MATH-SAMPLE',       exam_date: daysOut(7),  weekly_hours: 10, topic_confidence: { algebra: 3, calculus: 2, mechanics: 4 } },
    { exam_id: 'EXM-JEEMAIN-MATH-SAMPLE', exam_date: daysOut(90), weekly_hours: 8,  topic_confidence: { algebra: 2, calculus: 2, trigonometry: 3 } },
  ];
  const hist = [
    { daysAgo: 12, minutes: 30, multiExam: false },
    { daysAgo: 9,  minutes: 15, multiExam: false },
    { daysAgo: 7,  minutes: 60, multiExam: true  },
    { daysAgo: 4,  minutes: 8,  multiExam: false },
    { daysAgo: 2,  minutes: 15, multiExam: false },
    { daysAgo: 1,  minutes: 8,  multiExam: false },
  ];
  let plans = 0, minutes = 0;
  for (const h of hist) {
    const when = new Date(today);
    when.setUTCDate(when.getUTCDate() - h.daysAgo);
    const plan = await (h.multiExam
      ? planMultiExamSession({ student_id: activeStudent.id, exams: profile, minutes_available: h.minutes, now: when })
      : planSession({
          student_id: activeStudent.id,
          exam_id: profile[0].exam_id,
          exam_date: profile[0].exam_date,
          minutes_available: h.minutes,
          weekly_hours: 10,
          topic_confidence: profile[0].topic_confidence,
          now: when,
        }));
    savePlan(plan);
    const completionRate = 0.8 + Math.random() * 0.2;
    const actualMinutes = Math.round(h.minutes * completionRate);
    recordExecution(plan.id, activeStudent.id, {
      completed_at: new Date(when.getTime() + h.minutes * 60_000).toISOString(),
      actual_minutes_spent: actualMinutes,
      actions_completed: plan.actions.map((a: any, idx: number) => ({
        action_id: a.id ?? `action_${idx}`,
        completed: Math.random() < completionRate,
        attempts: a.kind === 'practice' ? 2 : undefined,
        correct:  a.kind === 'practice' ? 1 : undefined,
        actual_minutes: a.estimated_minutes,
      })),
    });
    logPracticeSession({
      student_id: activeStudent.id,
      minutes: actualMinutes,
      completed_at: new Date(when.getTime() + h.minutes * 60_000).toISOString(),
      source: 'plan-execution',
      plan_id: plan.id,
    });
    plans += 1; minutes += actualMinutes;
  }
  for (const e of [
    { daysAgo: 11, minutes: 5,  source: 'smart-practice' as const },
    { daysAgo: 6,  minutes: 12, source: 'practice-page'  as const },
    { daysAgo: 3,  minutes: 7,  source: 'smart-practice' as const },
  ]) {
    const t = new Date(today);
    t.setUTCDate(t.getUTCDate() - e.daysAgo);
    logPracticeSession({ student_id: activeStudent.id, minutes: e.minutes, completed_at: t.toISOString(), source: e.source });
  }
  return { plans, minutes };
}

async function seedRahulHistory() {
  const exam = { exam_id: 'EXM-BITSAT-MATH-SAMPLE', exam_date: daysOut(30), weekly_hours: 6, topic_confidence: { algebra: 2, calculus: 1 } };
  let plans = 0, minutes = 0;
  for (const h of [{ daysAgo: 5, minutes: 15 }, { daysAgo: 2, minutes: 8 }]) {
    const when = new Date(today);
    when.setUTCDate(when.getUTCDate() - h.daysAgo);
    const plan = await planSession({
      student_id: lightStudent.id,
      exam_id: exam.exam_id,
      exam_date: exam.exam_date,
      minutes_available: h.minutes,
      weekly_hours: 6,
      topic_confidence: exam.topic_confidence,
      now: when,
    });
    savePlan(plan);
    const actualMinutes = Math.round(h.minutes * 0.75);
    recordExecution(plan.id, lightStudent.id, {
      completed_at: new Date(when.getTime() + h.minutes * 60_000).toISOString(),
      actual_minutes_spent: actualMinutes,
      actions_completed: plan.actions.map((a: any, idx: number) => ({
        action_id: a.id ?? `action_${idx}`,
        completed: Math.random() < 0.75,
        actual_minutes: a.estimated_minutes,
      })),
    });
    logPracticeSession({
      student_id: lightStudent.id,
      minutes: actualMinutes,
      completed_at: new Date(when.getTime() + h.minutes * 60_000).toISOString(),
      source: 'plan-execution',
      plan_id: plan.id,
    });
    plans += 1; minutes += actualMinutes;
  }
  return { plans, minutes };
}

const priyaStats = await seedPriyaHistory();
const rahulStats = await seedRahulHistory();
console.log(`  Priya:  ${priyaStats.plans} plans / ${priyaStats.minutes} min`);
console.log(`  Rahul:  ${rahulStats.plans} plans / ${rahulStats.minutes} min`);
console.log(`  Aditya: 0 plans (intentional — first-time tester experience)`);

logDemoEvent({ role: 'student', user_id: activeStudent.id, event: 'seed.plans-written', detail: priyaStats });
logDemoEvent({ role: 'student', user_id: lightStudent.id,  event: 'seed.plans-written', detail: rahulStats });

// ─── 8. JWTs ──────────────────────────────────────────────────────────

console.log('\n--- step 8: JWTs ---');
const allTokens: Record<string, { user_id: string; role: string; token: string; name: string; email: string }> = {};

function mint(user: any, role: string, label: string): void {
  const token = issueToken({ user_id: user.id, role });
  allTokens[label] = { user_id: user.id, role, token, name: user.name, email: user.email };
  console.log(`  ${label.padEnd(16)}  ${role.padEnd(8)}  token:${token.slice(0, 20)}...`);
}
mint(ownerUser,            'owner',   'owner');
mint(adminUser,            'admin',   'admin');
mint(teacherUser,          'teacher', 'teacher');
mint(studentUsers[0].user, 'student', 'student-active');
mint(studentUsers[1].user, 'student', 'student-light');
mint(studentUsers[2].user, 'student', 'student-new');

writeFileSync('demo/demo-tokens.json', JSON.stringify(allTokens, null, 2));
console.log('  tokens written to demo/demo-tokens.json');

// ─── 9. role picker + API-keys HTML ───────────────────────────────────

console.log('\n--- step 9: demo landing pages ---');
const publicDir = 'frontend/public';
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const roleCards = [
  { key: 'owner',          emoji: '👑', role: 'Owner',   name: 'Nisha Rao',    lede: 'Platform-wide view. Promote admins. Transfer ownership. See every user.', landing: '/admin/founder', colour: '#fbbf24' },
  { key: 'admin',          emoji: '⚙️', role: 'Admin',   name: 'Arjun Gupta',  lede: 'Content + campaigns. Exam builder. Feedback triage. User admin.',           landing: '/admin',         colour: '#60a5fa' },
  { key: 'teacher',        emoji: '🎓', role: 'Teacher', name: 'Kavita Menon', lede: '2 students on the roster. Push concepts to their review queues.',           landing: '/teaching',      colour: '#a78bfa' },
  { key: 'student-active', emoji: '📚', role: 'Student', name: 'Priya Sharma', lede: 'Full history — 2 exams, 6 plans, 3 templates, live trailing stats.',        landing: '/planned',       colour: '#10b981', tag: 'active' },
  { key: 'student-light',  emoji: '📖', role: 'Student', name: 'Rahul Iyer',   lede: 'Light activity — 1 exam 30 days out, 2 plans. Just getting going.',         landing: '/planned',       colour: '#10b981', tag: 'light' },
  { key: 'student-new',    emoji: '🆕', role: 'Student', name: 'Aditya Shah',  lede: 'Fresh account. No profile, no history. Feel the first-time UX.',            landing: '/',              colour: '#10b981', tag: 'new' },
];

const cardHtml = roleCards.map(c => {
  const entry = allTokens[c.key];
  const tag = (c as any).tag ? `<span class="tag">${(c as any).tag}</span>` : '';
  return `
    <button class="card" data-token="${entry.token}" data-landing="${c.landing}" data-role="${c.role}" data-name="${c.name}" style="border-color:${c.colour}">
      <div class="card-emoji">${c.emoji}</div>
      <div class="card-role">${c.role} ${tag}</div>
      <div class="card-name">${c.name}</div>
      <div class="card-lede">${c.lede}</div>
    </button>`;
}).join('\n');

writeFileSync('frontend/public/demo.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vidhya demo — pick a role</title>
<style>
  * { box-sizing: border-box; }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px; min-height: 100vh; }
  .wrap { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 30px; margin: 0 0 8px; color: #ffffff; }
  .sub { color: #94a3b8; margin: 0 0 32px; font-size: 15px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); margin-bottom: 32px; }
  .card { background: #1e293b; border: 2px solid #334155; border-radius: 12px; padding: 22px; text-align: left; cursor: pointer;
    color: #e2e8f0; font: inherit; transition: transform .1s, border-color .15s; }
  .card:hover { transform: translateY(-2px); }
  .card:focus-visible { outline: 3px solid #60a5fa; outline-offset: 2px; }
  .card-emoji { font-size: 28px; margin-bottom: 8px; }
  .card-role { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
  .card-name { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }
  .card-lede { font-size: 13px; color: #cbd5e1; line-height: 1.5; }
  .tag { display: inline-block; background: #334155; color: #94a3b8; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }
  .notice { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-top: 24px; color: #cbd5e1; font-size: 12px; }
  .notice b { color: #e2e8f0; }
  .status { text-align: center; padding: 8px; color: #10b981; font-size: 12px; min-height: 20px; }
  a { color: #60a5fa; }
  code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Vidhya demo — pick a role</h1>
    <p class="sub">Each card signs you in as a different demo user. No sign-up. No Google OAuth. Pick one to explore through that role's eyes.</p>
    <div class="grid">${cardHtml}</div>
    <div class="status" id="status">&nbsp;</div>
    <div class="notice">
      <b>Heads up — this session is logged.</b> Your actions (pages visited, API calls)
      are written to <code>.data/demo-usage-log.json</code> so the owner can see how testers use the product.
      Demo-user id + event codes only; no free-text content.
      <br><br>
      <b>For full functionality, add an LLM key.</b> Features like the AI tutor, photo-snap problem analysis,
      and explainer generation need a provider key (Gemini / Claude / OpenAI).
      Once signed in, open <code>/gate/llm-config</code>. Keys stay in your browser.
      <br><br>
      <a href="/demo-api-keys.html">Which features need which keys →</a>
    </div>
  </div>
<script>
  const TOKEN_KEY = 'vidhya.auth.token.v1';
  const status = document.getElementById('status');
  for (const btn of document.querySelectorAll('.card')) {
    btn.addEventListener('click', () => {
      try { localStorage.setItem(TOKEN_KEY, btn.dataset.token); }
      catch (e) {
        status.textContent = 'Could not set localStorage. Storage disabled?';
        status.style.color = '#f87171'; return;
      }
      status.textContent = 'Signing in as ' + btn.dataset.name + ' (' + btn.dataset.role + ')…';
      setTimeout(() => { window.location = btn.dataset.landing; }, 400);
    });
  }
</script>
</body>
</html>
`);
console.log('  frontend/public/demo.html written');

// In Docker (production), gate-server serves from frontend/dist/ only —
// frontend/public/ is not served. Copy the generated pages there too so
// http://<host>/demo.html works without a Vite dev server.
const distDir = 'frontend/dist';
if (existsSync(distDir)) {
  copyFileSync('frontend/public/demo.html', `${distDir}/demo.html`);
  console.log('  frontend/dist/demo.html written (Docker/production path)');
}

// API-keys reference page
writeFileSync('frontend/public/demo-api-keys.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vidhya demo — API keys</title>
<style>
  body { font: 14px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f172a; color: #e2e8f0; max-width: 820px; margin: 0 auto; padding: 40px 20px; }
  h1 { color: #ffffff; font-size: 26px; }
  h2 { color: #ffffff; font-size: 18px; margin-top: 32px; border-bottom: 1px solid #334155; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; }
  th { background: #1e293b; color: #cbd5e1; font-weight: 600; }
  .good { color: #10b981; font-weight: 600; }
  .keyed { color: #fbbf24; font-weight: 600; }
  code { background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
  a { color: #60a5fa; }
</style></head><body>
<h1>Which demo features need which keys?</h1>
<p>Most of Vidhya runs without any LLM API key. A few features call a live model — for those, plug your own provider key into <code>/gate/llm-config</code>. Keys stay in your browser; the server never sees them.</p>

<h2>Works without any key</h2>
<table>
<tr><th>Feature</th><th>Status</th></tr>
<tr><td>Session planner (single + multi-exam)</td><td class="good">✓ no key</td></tr>
<tr><td>Trailing stats badge</td><td class="good">✓ no key</td></tr>
<tr><td>Template presets (one-tap recall)</td><td class="good">✓ no key</td></tr>
<tr><td>Exam profile management</td><td class="good">✓ no key</td></tr>
<tr><td>Notebook — existing notes</td><td class="good">✓ no key</td></tr>
<tr><td>Content bundle (tier-0 cached lessons)</td><td class="good">✓ no key</td></tr>
<tr><td>Admin + teacher roster views</td><td class="good">✓ no key</td></tr>
</table>

<h2>Needs one LLM key (BYOK)</h2>
<table>
<tr><th>Feature</th><th>Any of these providers</th></tr>
<tr><td>AI tutor chat</td><td class="keyed">Gemini · Claude · OpenAI · Groq · OpenRouter · Ollama</td></tr>
<tr><td>Photo-snap problem analysis</td><td class="keyed">Gemini · Claude · OpenAI (with vision)</td></tr>
<tr><td>Explainer generation (new concept)</td><td class="keyed">Any</td></tr>
<tr><td>Weekly-digest LLM narration</td><td class="keyed">Any</td></tr>
<tr><td>Admin agent tools (narrate/summarise/suggest)</td><td class="keyed">Any</td></tr>
</table>

<h2>Needs a specific external service</h2>
<table>
<tr><th>Feature</th><th>Credential</th></tr>
<tr><td>Wolfram-verified maths answers</td><td class="keyed"><code>WOLFRAM_APP_ID</code></td></tr>
<tr><td>Telegram channel delivery</td><td class="keyed"><code>TELEGRAM_BOT_TOKEN</code></td></tr>
<tr><td>WhatsApp channel delivery</td><td class="keyed">WhatsApp Cloud API token</td></tr>
<tr><td>Google sign-in (non-demo)</td><td class="keyed"><code>GOOGLE_OAUTH_CLIENT_ID</code></td></tr>
</table>

<h2>How to plug in a key</h2>
<ol>
<li>Sign in as any role (student gives the richest BYOK surface).</li>
<li>Navigate to <a href="/gate/llm-config">/gate/llm-config</a>.</li>
<li>Pick a provider, paste the key, click <b>Validate</b>.</li>
<li>Chat / Snap / Explainer now use that provider.</li>
</ol>

<p><a href="/demo.html">← back to role picker</a></p>
</body></html>`);
console.log('  frontend/public/demo-api-keys.html written');
if (existsSync(distDir)) {
  copyFileSync('frontend/public/demo-api-keys.html', `${distDir}/demo-api-keys.html`);
  console.log('  frontend/dist/demo-api-keys.html written (Docker/production path)');
}

logDemoEvent({ role: 'unknown', user_id: null, event: 'seed.completed' });

// ─── summary ──────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('Multi-role demo seed complete.');
console.log('═'.repeat(60));
console.log(`
Roles created:
  👑 owner    — Nisha Rao    (${ownerUser.id})
  ⚙  admin    — Arjun Gupta  (${adminUser.id})
  🎓 teacher  — Kavita Menon (${teacherUser.id}, 2 students)
  📚 student  — Priya Sharma (active: 2 exams, 6 plans, 3 templates)
  📖 student  — Rahul Iyer   (light: 1 exam, 2 plans)
  🆕 student  — Aditya Shah  (new: no data — first-time UX)

Start:
  npm run demo:start
  -> open http://localhost:3000/demo.html

Logs (owner-visible):
  npm run demo:log    (or read .data/demo-usage-log.json)

Reset:
  npm run demo:reset
`);
