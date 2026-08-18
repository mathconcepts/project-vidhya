/**
 * src/scenarios/demo-history-seeder.ts — T20 (D9, OV2-2): writes multi-day
 * Elo/FSRS/XP demo history for the AUTH-IDENTITY demo accounts (the
 * `user_<sha256>` ids `demo/seed.ts` mints via `upsertFromGoogle`), NOT
 * the `0aded0a0-` scenario namespace `src/scenarios/persona-seeder.ts`
 * writes to.
 *
 * CRITICAL (OV2-2): routes key on the JWT id — `POST /api/practice/attempt`,
 * `StudentModel.update()`, `fsrs_cards`, `student_skill_elo`, and
 * `xp_events` are all keyed by whatever id sits in the request's auth
 * token. A logged-in Meera authenticates as her `user_<sha256>` demo
 * account (minted in `demo/seed.ts`'s step 4b persona loop); history
 * written under the DIFFERENT `0aded0a0-` scenario-persona namespace
 * would be completely invisible to her live session. This module is the
 * missing half: it writes the SAME kind of history, under the id that
 * `/demo-login?role=<persona-id>` actually signs the visitor in as.
 *
 * Guard (OV2-2, non-negotiable): `assertDemoMintedUserId()` refuses any id
 * that isn't a real row in the auth user-store with a `google_sub`
 * starting with `demo-` — the same prefix discipline every demo-seeded
 * account uses (`demo-owner-*`, `demo-admin-*`, `demo-teacher-*`,
 * `demo-student-*`, `demo-persona-*`). A real student's account can never
 * collide with that prefix (their `google_sub` is Google's own opaque
 * subject claim), so this is a hard, cheap safety net against ever
 * writing simulated history onto a real person's account — mirrors the
 * `0aded0a0-` UUID-prefix discipline `persona-seeder.ts` already uses for
 * the scenario namespace, adapted to the auth-identity id shape.
 *
 * `seedDemoUserHistory()` replays the EXACT `gradedAttempts` sequence
 * `demo-history-plan.ts`'s `simulate()` already computed (deterministic,
 * seeded PRNG) against the REAL `StudentModel.update()` (Elo+FSRS+FIRe+
 * dedup, migration 029/030/045) and `awardXp()` (migration 046) — the
 * identical write path `POST /api/practice/attempt` uses. Idempotent:
 * `StudentModel.update()`'s own `(studentId, objectId, ts)` dedup means
 * re-running this seeder against an already-seeded account is a safe
 * no-op, not a double-count.
 */

import { getUserById } from '../auth/user-store';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { getStudentModel } from '../gbrain/student-model-pg';
import { awardXp } from '../gbrain/xp-store';
import type { Attempt } from '../core/interfaces';
import { buildAttempts, simulate, type ConceptGroupSpec, type DemoHistorySimulation } from './demo-history-plan';

/** Every demo-seeded account (owner/admin/teacher/student/persona) carries this google_sub prefix — see demo/seed.ts. */
const DEMO_GOOGLE_SUB_PREFIX = 'demo-';

export function isDemoMintedUserId(userId: string): boolean {
  const user = getUserById(userId);
  return Boolean(user?.google_sub && user.google_sub.startsWith(DEMO_GOOGLE_SUB_PREFIX));
}

/** Throws with a precise, actionable message — never silently no-ops on a refusal. */
export function assertDemoMintedUserId(userId: string): void {
  if (isDemoMintedUserId(userId)) return;
  const user = getUserById(userId);
  throw new Error(
    user
      ? `demo-history-seeder: refusing to seed "${userId}" — google_sub "${user.google_sub}" is not demo-minted (must start with "${DEMO_GOOGLE_SUB_PREFIX}").`
      : `demo-history-seeder: refusing to seed "${userId}" — no such user in the auth store. This seeder only writes onto accounts demo/seed.ts already created.`,
  );
}

export interface SeedDemoHistoryResult {
  userId: string;
  personaId: string;
  attemptsRecorded: number;
  xpEventsAwarded: number;
  conceptsTouched: number;
  simulation: DemoHistorySimulation;
}

export async function seedDemoUserHistory(
  userId: string,
  personaId: string,
  groups: ReadonlyArray<ConceptGroupSpec>,
  opts: { now?: Date; xpWindowDays?: number } = {},
): Promise<SeedDemoHistoryResult> {
  assertDemoMintedUserId(userId);

  const now = opts.now ?? new Date();
  const catalog = getLearningObjectCatalog();

  const itemIdCache = new Map<string, string | null>();
  async function itemIdForConcept(conceptId: string): Promise<string | null> {
    if (!itemIdCache.has(conceptId)) {
      const rows = await catalog.query({ skillId: conceptId, limit: 1 });
      itemIdCache.set(conceptId, rows[0]?.id ?? null);
    }
    return itemIdCache.get(conceptId)!;
  }

  const idsByConcept = new Map<string, string | null>();
  for (const g of groups) {
    if (!idsByConcept.has(g.conceptId)) idsByConcept.set(g.conceptId, await itemIdForConcept(g.conceptId));
  }

  if (!catalog.getById) {
    throw new Error('demo-history-seeder: catalog has no getById — cannot resolve items to grade against');
  }
  const getById = catalog.getById.bind(catalog);

  const rawAttempts = buildAttempts(personaId, groups, now, (c) => idsByConcept.get(c) ?? null);
  const simulation = await simulate(personaId, rawAttempts, now, getById, {
    xpWindowDays: opts.xpWindowDays,
  });

  const studentModel = getStudentModel();
  let attemptsRecorded = 0;
  let xpEventsAwarded = 0;
  const conceptsTouched = new Set<string>();

  // Sequential, not Promise.all: StudentModel.update() opens its own
  // transaction per call and FIRe's lock-order discipline (student-elo →
  // item-elo → primary card) assumes attempts land one at a time, same as
  // real traffic would — this is a seed script, not a hot path.
  for (const g of simulation.gradedAttempts) {
    const attempt: Attempt = {
      studentId: userId,
      objectId: g.objectId,
      skillId: g.conceptId,
      correct: g.correct,
      partialMarks: { earned: g.earned, max: g.max, perCriterion: g.perCriterion },
      latencyMs: g.latencyMs,
      ts: g.tsMs,
    };
    try {
      await studentModel.update(attempt);
      attemptsRecorded++;
      conceptsTouched.add(g.conceptId);
    } catch (err) {
      console.error(`[demo-history-seeder] update() failed for ${userId}/${g.objectId}@${g.tsMs}:`, (err as Error).message);
      continue; // one bad attempt doesn't abort the whole seed run
    }

    if (g.withinXpWindow && g.xpAmount !== 0) {
      await awardXp({ studentId: userId, objectId: g.objectId, skillId: g.conceptId, xpAmount: g.xpAmount, source: 'practice', tsMs: g.tsMs });
      xpEventsAwarded++;
    }
  }

  return {
    userId, personaId, attemptsRecorded, xpEventsAwarded,
    conceptsTouched: conceptsTouched.size,
    simulation,
  };
}
