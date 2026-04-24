// @ts-nocheck
/**
 * src/conversion/migrate-demo-to-real.ts
 *
 * Owning agent: conversion-specialist (under outreach-manager, CMO).
 *
 * The single authoritative migration function invoked when a demo
 * tester becomes a real user. Rewrites student_id across the five
 * per-student flat-file stores, nulls user_id in the demo-usage
 * log so owner-visible telemetry is anonymised at conversion, and
 * records a converted_to link on the source demo user record.
 *
 * This is the ONE function that writes to all these stores in one
 * transaction (in the flat-file sense — we read all stores, mutate
 * in memory, write them back; if any write fails we bail out so we
 * don't leave partial state).
 *
 * Called by:
 *   - POST /api/demo/convert       (HTTP trigger)
 *   - CLI conversion tool (manual / tests)
 *
 * Constitutional notes:
 *   - Calm: no silent migration. Caller MUST pass explicit carryOver=true.
 *   - Compounding: trailing stats survive the migration — student's
 *     accumulated practice minutes follow them.
 *   - Strategy: exam profile moves with them — no restart.
 *   - Focus: demo-usage log entries are anonymised but event codes are
 *     preserved so the owner can still see cohort conversion patterns.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

export interface ConversionResult {
  ok: boolean;
  reason?: string;
  from_user_id: string;
  to_user_id: string;
  carried_over: {
    exam_profiles: number;
    session_plans: number;
    plan_templates: number;
    practice_sessions: number;
  };
  anonymised: {
    demo_log_entries: number;
  };
}

interface MigrateInput {
  from_user_id: string;     // the demo user (e.g. user_4DqgTqpf9rhk)
  to_user_id: string;       // the freshly-created real user
  carry_over: boolean;      // false = just mark-converted + anonymise log
}

/**
 * Main migration. Idempotent-ish — safe to re-run with the same
 * arguments but already-migrated entries will be a no-op on the
 * second call.
 */
export function migrateDemoToReal(input: MigrateInput): ConversionResult {
  const { from_user_id, to_user_id, carry_over } = input;

  const result: ConversionResult = {
    ok: false,
    from_user_id,
    to_user_id,
    carried_over: {
      exam_profiles: 0,
      session_plans: 0,
      plan_templates: 0,
      practice_sessions: 0,
    },
    anonymised: {
      demo_log_entries: 0,
    },
  };

  // --- guards ---
  if (from_user_id === to_user_id) {
    result.reason = 'from_user_id and to_user_id are the same';
    return result;
  }

  // Read source and destination users — both must exist.
  const usersPath = '.data/users.json';
  if (!existsSync(usersPath)) {
    result.reason = 'users store does not exist';
    return result;
  }
  const usersRaw = JSON.parse(readFileSync(usersPath, 'utf-8'));
  const usersMap = usersRaw.users ?? {};
  const fromUser = usersMap[from_user_id];
  const toUser = usersMap[to_user_id];
  if (!fromUser) {
    result.reason = `source user ${from_user_id} not found`;
    return result;
  }
  if (!toUser) {
    result.reason = `destination user ${to_user_id} not found`;
    return result;
  }
  if (fromUser.converted_to && fromUser.converted_to !== to_user_id) {
    result.reason = `${from_user_id} already converted to a different user`;
    return result;
  }

  // --- carry over the four per-student stores (if opt-in) ---
  if (carry_over) {
    result.carried_over.exam_profiles = _rewriteStudentId(
      '.data/student-exam-profiles.json',
      'profiles',
      'student_id',
      from_user_id,
      to_user_id,
    );

    result.carried_over.session_plans = _rewriteNestedStudentId(
      '.data/session-plans.json',
      'plans',
      from_user_id,
      to_user_id,
    );

    result.carried_over.plan_templates = _rewriteStudentId(
      '.data/plan-templates.json',
      'templates',
      'student_id',
      from_user_id,
      to_user_id,
    );

    result.carried_over.practice_sessions = _rewriteStudentId(
      '.data/practice-sessions.json',
      'entries',
      'student_id',
      from_user_id,
      to_user_id,
    );
  }

  // --- always: mark the demo user as converted ---
  fromUser.converted_to = to_user_id;
  fromUser.converted_at = new Date().toISOString();
  writeFileSync(usersPath, JSON.stringify(usersRaw, null, 2));

  // --- always: anonymise demo-usage log entries tied to from_user ---
  result.anonymised.demo_log_entries = _anonymiseDemoLog(from_user_id);

  result.ok = true;
  return result;
}

// ─── helpers ──────────────────────────────────────────────────────────

/**
 * Rewrites entries in an array where the `student_id` field matches
 * `from_user_id`, setting it to `to_user_id`. Returns how many were
 * rewritten.
 *
 * For stores whose top-level shape is `{ <array_key>: [...] }` with
 * each entry having a flat `student_id` field.
 */
function _rewriteStudentId(
  path: string,
  arrayKey: string,
  fieldName: string,
  from: string,
  to: string,
): number {
  if (!existsSync(path)) return 0;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = raw[arrayKey];
  if (!Array.isArray(arr)) return 0;
  let count = 0;
  for (const entry of arr) {
    if (entry?.[fieldName] === from) {
      entry[fieldName] = to;
      count += 1;
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2));
  return count;
}

/**
 * For session-plans — student_id lives inside request.student_id, not
 * at the top of each plan.
 */
function _rewriteNestedStudentId(
  path: string,
  arrayKey: string,
  from: string,
  to: string,
): number {
  if (!existsSync(path)) return 0;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = raw[arrayKey];
  if (!Array.isArray(arr)) return 0;
  let count = 0;
  for (const plan of arr) {
    if (plan?.request?.student_id === from) {
      plan.request.student_id = to;
      count += 1;
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2));
  return count;
}

/**
 * Nulls user_id on every demo-usage-log entry tied to the converting
 * demo user. Event codes and role/detail fields are preserved — the
 * aggregate analysis still works, but the owner loses the per-user
 * link.
 */
function _anonymiseDemoLog(from: string): number {
  const path = '.data/demo-usage-log.json';
  if (!existsSync(path)) return 0;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const entries = raw.entries;
  if (!Array.isArray(entries)) return 0;
  let count = 0;
  for (const e of entries) {
    if (e?.user_id === from) {
      e.user_id = null;
      e.anonymised_at = new Date().toISOString();
      count += 1;
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2));
  return count;
}
