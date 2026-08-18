// @ts-nocheck
/**
 * demo/seed-history.ts — T20 (D9, OV2-2): writes multi-day Elo/FSRS/XP
 * demo history for the LA-focused demo personas, onto their real AUTH
 * identities (the `user_<sha256>` ids `demo/seed.ts` mints), so the
 * B-layer mechanisms (FIRe scheduling, due-review compression, the
 * frontier view, an unlockable checkpoint quiz) are visible on demo day
 * instead of every fresh account starting at "building your baseline."
 *
 * Run:    npm run demo:seed-history   (after npm run demo:seed)
 * Reset:  npm run demo:reset (drops the underlying auth store; history
 *         goes with it — this script has nothing extra to clean up)
 *
 * REQUIRES DATABASE_URL (Elo/FSRS/XP are Postgres-backed — migrations
 * 029/030/045/046). Boot chains that don't set one (local dev without
 * `docker compose`, a DB-less demo deploy) get an honest skip, not a
 * crash — this script is chained with `&&` in demo/Dockerfile's CMD and
 * must never abort the rest of boot.
 *
 * Resolves each target persona's real auth user_id from
 * demo/demo-tokens.json (written by demo/seed.ts's step 8 — persona
 * accounts are minted and keyed there by persona slug) rather than
 * re-deriving the id — one less place that has to agree with
 * newUserId()'s hashing scheme.
 */

import { readFileSync, existsSync } from 'fs';
import pg from 'pg';
import { autoMigrate } from '../src/db/auto-migrate';
import { seedDemoUserHistory } from '../src/scenarios/demo-history-seeder';
import {
  meeraHistoryGroups, MEERA_XP_WINDOW_DAYS,
  rahulHistoryGroups, RAHUL_XP_WINDOW_DAYS,
} from '../src/scenarios/demo-personas-history';

if (!process.env.DATABASE_URL) {
  console.log('demo:seed-history — DATABASE_URL not set, skipping (Elo/FSRS/XP history needs Postgres).');
  console.log('Set DATABASE_URL (see D4 in the linear-algebra plan doc) to seed persona history for the demo.');
  process.exit(0);
}

const TOKENS_PATH = 'demo/demo-tokens.json';
if (!existsSync(TOKENS_PATH)) {
  console.log(`demo:seed-history — ${TOKENS_PATH} not found. Run npm run demo:seed first. Skipping.`);
  process.exit(0);
}

// This script runs BEFORE the server (same "seed-then-serve" CMD chain as
// demo:seed / demo:seed-media — demo/Dockerfile), so the tables this
// history needs (student_skill_elo, fsrs_cards, xp_events, ... —
// migrations 029/030/045/046) have not been created by the server's own
// boot-time autoMigrate() yet. Apply migrations here too — idempotent
// (tracked in _migrations), so this is a safe no-op if the server (or a
// previous run of this script) already applied them.
{
  const { Pool } = pg;
  const migratePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const applied = await autoMigrate(migratePool);
  console.log(`demo:seed-history — applied ${applied} pending migration(s).`);
  await migratePool.end();
}

const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));

async function seedOne(personaId: string, groups: any[], xpWindowDays: number) {
  const entry = tokens[personaId];
  if (!entry?.user_id) {
    console.log(`  ! ${personaId}: no demo account found in ${TOKENS_PATH} — skipping (persona YAML may be missing).`);
    return;
  }
  try {
    const result = await seedDemoUserHistory(entry.user_id, personaId, groups, { xpWindowDays });
    console.log(
      `  ${personaId} (${entry.user_id}): ${result.attemptsRecorded} attempts, ` +
      `${result.conceptsTouched} concepts touched, ${result.xpEventsAwarded} XP events, ` +
      `total_xp_minutes=${result.simulation.totalXpMinutes}, due=${result.simulation.dueConceptIds.length}`,
    );
  } catch (err: any) {
    console.error(`  ! ${personaId}: seeding failed — ${err?.message ?? err}`);
  }
}

console.log('\n--- demo:seed-history ---');
await seedOne('meera-gate-la-anxious', meeraHistoryGroups(), MEERA_XP_WINDOW_DAYS);
await seedOne('rahul-gate-rank-push', rahulHistoryGroups(), RAHUL_XP_WINDOW_DAYS);
console.log('demo:seed-history complete.\n');
