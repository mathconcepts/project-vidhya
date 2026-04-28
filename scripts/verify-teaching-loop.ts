// @ts-nocheck
/**
 * scripts/verify-teaching-loop.ts
 *
 * Runtime end-to-end test that proves the teaching loop is observable.
 *
 * What "the loop closes" means:
 *
 *   1. A request comes in → openTurn fires → log gets a turn-open event
 *   2. The handler does its work
 *   3. closeTurn fires (success or error) → log gets a turn-close event
 *   4. /api/turns/me returns the turn with status='closed' + the right
 *      pre_state and degraded.reason fields
 *
 * This script proves all four steps for the chat path's degraded-mode
 * branch (the path that's reachable without an LLM key, the only path
 * we can sandbox-test).
 *
 * Preconditions:
 *   - npm run demo:seed has been run
 *   - Backend running on :8080 (no GEMINI_API_KEY set so chat goes
 *     through the degraded-mode path)
 *   - JWT_SECRET matches between seed and server
 *
 * Exit code:
 *   0 = all assertions passed
 *   1 = any assertion failed
 */

import { readFileSync, existsSync } from 'fs';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:8080';

let pass_count = 0;
let fail_count = 0;

function pass(msg: string): void { console.log(`  ✓ ${msg}`); pass_count += 1; }
function fail(msg: string): void { console.error(`  ✗ ${msg}`); fail_count += 1; }

async function main() {
  console.log('\nTeaching-loop verification\n');

  if (!existsSync('demo/demo-tokens.json')) {
    fail('demo/demo-tokens.json missing — run `npm run demo:seed` first');
    process.exit(1);
  }
  const tokens = JSON.parse(readFileSync('demo/demo-tokens.json', 'utf-8'));
  const student = tokens['student-active'];
  const owner = tokens['owner'];

  // ── Step 1: clean slate? Count existing turns for this student ───────
  const before_resp = await fetch(`${BASE}/api/turns/me`, {
    headers: { 'Authorization': `Bearer ${student.token}` },
  });
  if (before_resp.status !== 200) {
    fail(`/api/turns/me precheck returned HTTP ${before_resp.status}`);
    process.exit(1);
  }
  const before_data = await before_resp.json();
  const initial_turn_count = before_data.summary.total_turns;
  pass(`baseline: student has ${initial_turn_count} turn(s) recorded`);

  // ── Step 2: fire a chat request that we know will hit degraded mode ──
  // No GEMINI_API_KEY in this environment, so the handler returns 503
  // and records a degraded turn.
  const session_id = `verify-loop-${Date.now()}`;
  const message = 'verify-loop probe: explain limits';
  const chat_resp = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${student.token}`,
    },
    body: JSON.stringify({ sessionId: session_id, message }),
  });
  if (chat_resp.status !== 503) {
    fail(`/api/chat expected HTTP 503 (degraded mode); got ${chat_resp.status}`);
    process.exit(1);
  }
  pass('chat returned HTTP 503 (degraded mode)');

  // Brief pause so the append + read settles on disk
  await new Promise(r => setTimeout(r, 200));

  // ── Step 3: a new turn should now exist ──────────────────────────────
  const after_resp = await fetch(`${BASE}/api/turns/me`, {
    headers: { 'Authorization': `Bearer ${student.token}` },
  });
  const after_data = await after_resp.json();
  const new_turn_count = after_data.summary.total_turns;
  if (new_turn_count !== initial_turn_count + 1) {
    fail(`expected exactly 1 new turn; saw ${new_turn_count - initial_turn_count}`);
    process.exit(1);
  }
  pass(`turn count went from ${initial_turn_count} to ${new_turn_count}`);

  // ── Step 4: most recent turn should be closed and degraded ───────────
  const newest = after_data.turns[0];
  if (newest.status !== 'closed') {
    fail(`expected most recent turn to be 'closed'; got '${newest.status}'`);
    process.exit(1);
  }
  pass(`most recent turn has status='closed'`);

  if (newest.degraded?.reason !== 'no-llm-available') {
    fail(`expected degraded.reason='no-llm-available'; got ${JSON.stringify(newest.degraded)}`);
    process.exit(1);
  }
  pass(`degraded.reason='no-llm-available' correctly recorded`);

  if (newest.intent !== 'explain-concept') {
    fail(`expected intent='explain-concept' (from "explain limits"); got '${newest.intent}'`);
    process.exit(1);
  }
  pass(`intent classified correctly as 'explain-concept'`);

  // ── Step 5: admin firehose should also see this turn ─────────────────
  const admin_resp = await fetch(`${BASE}/api/turns?limit=5`, {
    headers: { 'Authorization': `Bearer ${owner.token}` },
  });
  if (admin_resp.status !== 200) {
    fail(`/api/turns admin firehose HTTP ${admin_resp.status}`);
    process.exit(1);
  }
  const admin_data = await admin_resp.json();
  const found_in_firehose = admin_data.turns.find((t: any) => t.turn_id === newest.turn_id);
  if (!found_in_firehose) {
    fail(`turn ${newest.turn_id} not visible in admin firehose`);
    process.exit(1);
  }
  pass(`turn visible in admin firehose at ${newest.turn_id}`);

  // ── Step 6: cross-student isolation ──────────────────────────────────
  // Another student calling /api/turns/me must NOT see this student's turn.
  const other_student = tokens['student-light'];
  const other_resp = await fetch(`${BASE}/api/turns/me`, {
    headers: { 'Authorization': `Bearer ${other_student.token}` },
  });
  const other_data = await other_resp.json();
  const cross_visible = other_data.turns.find((t: any) => t.turn_id === newest.turn_id);
  if (cross_visible) {
    fail(`cross-student leak: student-light sees student-active's turn ${newest.turn_id}`);
    process.exit(1);
  }
  pass('cross-student isolation upheld');

  // ── Step 7: trying to read another student's turns directly is 403 ───
  const cross_403 = await fetch(`${BASE}/api/turns/student/${student.user_id}`, {
    headers: { 'Authorization': `Bearer ${other_student.token}` },
  });
  if (cross_403.status !== 403) {
    fail(`expected HTTP 403 cross-student read; got ${cross_403.status}`);
    process.exit(1);
  }
  pass('cross-student authorization returns 403');

  // ── Step 8: anonymous chat → anon_ turn visible only to admin ───────
  const anon_session = `anon-loop-${Date.now()}`;
  await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: anon_session, message: 'anon probe' }),
  });
  await new Promise(r => setTimeout(r, 200));
  const admin_resp_2 = await fetch(`${BASE}/api/turns?limit=10`, {
    headers: { 'Authorization': `Bearer ${owner.token}` },
  });
  const admin_data_2 = await admin_resp_2.json();
  const anon_turn = admin_data_2.turns.find(
    (t: any) => t.student_id === `anon_${anon_session}`,
  );
  if (!anon_turn) {
    fail(`anon turn for session ${anon_session} not found in firehose`);
    process.exit(1);
  }
  pass(`anonymous chat produced turn under anon_${anon_session}`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('');
  if (fail_count === 0) {
    console.log(`All ${pass_count} checks passed. Teaching loop is observable end-to-end.`);
    process.exit(0);
  } else {
    console.error(`${fail_count} check(s) failed (${pass_count} passed)`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
