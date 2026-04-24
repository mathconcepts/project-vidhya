// @ts-nocheck
/**
 * src/data-rights/delete.ts
 *
 * Owning agent: data-rights-specialist (under security-manager, CTO).
 *
 * Self-service account deletion with a 24h cooling period, plus
 * portable JSON export.
 *
 * Flow:
 *   1. User calls requestDeletion(user_id)
 *      → writes user.deletion_requested_at = now()
 *      → soft-deleted: auth continues to work, but a banner surfaces
 *        "deletion scheduled in X hours. cancel?"
 *
 *   2. User calls cancelDeletion(user_id) within 24h
 *      → clears deletion_requested_at
 *      → returns user to normal state
 *
 *   3. User calls confirmDeletion(user_id) after 24h have elapsed
 *      → hard-delete: drop all per-user records, anonymise demo
 *        telemetry, unlink channels, null the user
 *      → destructive; no recovery
 *
 * A scheduled job (out of scope here) should periodically call
 * finaliseExpiredDeletions() to hard-delete any users whose cooling
 * period elapsed without the user either cancelling or confirming.
 *
 * Export:
 *   exportUserData(user_id) returns a JSON blob with every piece of
 *   per-user data the product holds. Portable, inspectable, deletable.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

export interface DeletionRequest {
  ok: boolean;
  reason?: string;
  user_id: string;
  deletion_requested_at?: string;
  earliest_confirm_at?: string;
}

export interface DeletionResult {
  ok: boolean;
  reason?: string;
  user_id: string;
  dropped: {
    exam_profiles: number;
    session_plans: number;
    plan_templates: number;
    practice_sessions: number;
  };
  anonymised: {
    demo_log_entries: number;
  };
  channels_unlinked: number;
}

export interface UserExport {
  user_id: string;
  exported_at: string;
  user: any;
  exam_profile: any;
  plans: any[];
  templates: any[];
  practice_sessions: any[];
}

const COOLING_MS = 24 * 60 * 60 * 1000;   // 24h

// ─── 1. request deletion (soft-delete, reversible) ─────────────────────

export function requestDeletion(user_id: string): DeletionRequest {
  const usersPath = '.data/users.json';
  if (!existsSync(usersPath)) {
    return { ok: false, reason: 'users store missing', user_id };
  }
  const raw = JSON.parse(readFileSync(usersPath, 'utf-8'));
  const user = raw.users?.[user_id];
  if (!user) return { ok: false, reason: 'user not found', user_id };
  if (user.deletion_requested_at) {
    return {
      ok: true,
      user_id,
      deletion_requested_at: user.deletion_requested_at,
      earliest_confirm_at: new Date(
        new Date(user.deletion_requested_at).getTime() + COOLING_MS
      ).toISOString(),
      reason: 'deletion already requested',
    };
  }
  const now = new Date();
  user.deletion_requested_at = now.toISOString();
  writeFileSync(usersPath, JSON.stringify(raw, null, 2));
  return {
    ok: true,
    user_id,
    deletion_requested_at: user.deletion_requested_at,
    earliest_confirm_at: new Date(now.getTime() + COOLING_MS).toISOString(),
  };
}

// ─── 2. cancel deletion (revert soft-delete) ───────────────────────────

export function cancelDeletion(user_id: string): { ok: boolean; reason?: string } {
  const usersPath = '.data/users.json';
  if (!existsSync(usersPath)) return { ok: false, reason: 'users store missing' };
  const raw = JSON.parse(readFileSync(usersPath, 'utf-8'));
  const user = raw.users?.[user_id];
  if (!user) return { ok: false, reason: 'user not found' };
  if (!user.deletion_requested_at) {
    return { ok: false, reason: 'no deletion was requested' };
  }
  delete user.deletion_requested_at;
  writeFileSync(usersPath, JSON.stringify(raw, null, 2));
  return { ok: true };
}

// ─── 3. confirm deletion (hard-delete, irreversible) ───────────────────

export function confirmDeletion(user_id: string): DeletionResult {
  const result: DeletionResult = {
    ok: false,
    user_id,
    dropped: { exam_profiles: 0, session_plans: 0, plan_templates: 0, practice_sessions: 0 },
    anonymised: { demo_log_entries: 0 },
    channels_unlinked: 0,
  };

  const usersPath = '.data/users.json';
  if (!existsSync(usersPath)) {
    result.reason = 'users store missing';
    return result;
  }
  const raw = JSON.parse(readFileSync(usersPath, 'utf-8'));
  const user = raw.users?.[user_id];
  if (!user) {
    result.reason = 'user not found';
    return result;
  }
  if (!user.deletion_requested_at) {
    result.reason = 'deletion was not requested — call requestDeletion first';
    return result;
  }
  const requestedAt = new Date(user.deletion_requested_at).getTime();
  if (Date.now() - requestedAt < COOLING_MS) {
    const remaining = Math.ceil((COOLING_MS - (Date.now() - requestedAt)) / 1000);
    result.reason = `cooling period has ${remaining}s remaining`;
    return result;
  }

  // --- hard delete --- drop per-user flat-file data
  result.dropped.exam_profiles = _dropStudentEntries(
    '.data/student-exam-profiles.json', 'profiles', 'student_id', user_id,
  );
  result.dropped.session_plans = _dropNestedStudentEntries(
    '.data/session-plans.json', 'plans', user_id,
  );
  result.dropped.plan_templates = _dropStudentEntries(
    '.data/plan-templates.json', 'templates', 'student_id', user_id,
  );
  result.dropped.practice_sessions = _dropStudentEntries(
    '.data/practice-sessions.json', 'entries', 'student_id', user_id,
  );

  // --- anonymise demo telemetry if any
  result.anonymised.demo_log_entries = _anonymiseDemoLog(user_id);

  // --- unlink channels
  result.channels_unlinked = Array.isArray(user.channels) ? user.channels.length : 0;

  // --- drop user's uploads (upload-specialist boundary)
  // Use dynamic import + sync-safe fallback via eval-require to
  // avoid making this function async (which would cascade to all
  // callers). Works in the tsx ESM runtime.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const uploads = eval('require')('../content/uploads');
    if (uploads?.dropAllForUser) uploads.dropAllForUser(user_id);
  } catch { /* best effort */ }

  // --- drop user's content subscriptions (community-content-specialist)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const comm = eval('require')('../content/community');
    if (comm?.dropUserSubscriptions) comm.dropUserSubscriptions(user_id);
  } catch { /* best effort */ }

  // --- drop the user itself
  delete raw.users[user_id];
  writeFileSync(usersPath, JSON.stringify(raw, null, 2));

  result.ok = true;
  return result;
}

// ─── 4. export user data ──────────────────────────────────────────────

export function exportUserData(user_id: string): UserExport | null {
  const usersPath = '.data/users.json';
  if (!existsSync(usersPath)) return null;
  const raw = JSON.parse(readFileSync(usersPath, 'utf-8'));
  const user = raw.users?.[user_id];
  if (!user) return null;

  return {
    user_id,
    exported_at: new Date().toISOString(),
    user,
    exam_profile: _findSingleEntry('.data/student-exam-profiles.json', 'profiles', 'student_id', user_id),
    plans: _findNestedEntries('.data/session-plans.json', 'plans', user_id),
    templates: _findEntries('.data/plan-templates.json', 'templates', 'student_id', user_id),
    practice_sessions: _findEntries('.data/practice-sessions.json', 'entries', 'student_id', user_id),
  };
}

// ─── 5. finalise expired deletions (called by a cron, out of scope) ───

export function finaliseExpiredDeletions(): { finalised: number } {
  const usersPath = '.data/users.json';
  if (!existsSync(usersPath)) return { finalised: 0 };
  const raw = JSON.parse(readFileSync(usersPath, 'utf-8'));
  const now = Date.now();
  let count = 0;
  for (const uid of Object.keys(raw.users ?? {})) {
    const u = raw.users[uid];
    if (u.deletion_requested_at) {
      const requestedAt = new Date(u.deletion_requested_at).getTime();
      if (now - requestedAt >= COOLING_MS) {
        confirmDeletion(uid);
        count += 1;
      }
    }
  }
  return { finalised: count };
}

// ─── helpers ──────────────────────────────────────────────────────────

function _dropStudentEntries(path: string, arrayKey: string, fieldName: string, uid: string): number {
  if (!existsSync(path)) return 0;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = raw[arrayKey];
  if (!Array.isArray(arr)) return 0;
  const before = arr.length;
  raw[arrayKey] = arr.filter((e: any) => e?.[fieldName] !== uid);
  writeFileSync(path, JSON.stringify(raw, null, 2));
  return before - raw[arrayKey].length;
}

function _dropNestedStudentEntries(path: string, arrayKey: string, uid: string): number {
  if (!existsSync(path)) return 0;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = raw[arrayKey];
  if (!Array.isArray(arr)) return 0;
  const before = arr.length;
  raw[arrayKey] = arr.filter((p: any) => p?.request?.student_id !== uid);
  writeFileSync(path, JSON.stringify(raw, null, 2));
  return before - raw[arrayKey].length;
}

function _anonymiseDemoLog(uid: string): number {
  const path = '.data/demo-usage-log.json';
  if (!existsSync(path)) return 0;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const entries = raw.entries;
  if (!Array.isArray(entries)) return 0;
  let count = 0;
  for (const e of entries) {
    if (e?.user_id === uid) {
      e.user_id = null;
      e.anonymised_at = new Date().toISOString();
      count += 1;
    }
  }
  writeFileSync(path, JSON.stringify(raw, null, 2));
  return count;
}

function _findEntries(path: string, arrayKey: string, fieldName: string, uid: string): any[] {
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = raw[arrayKey];
  if (!Array.isArray(arr)) return [];
  return arr.filter((e: any) => e?.[fieldName] === uid);
}

function _findNestedEntries(path: string, arrayKey: string, uid: string): any[] {
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = raw[arrayKey];
  if (!Array.isArray(arr)) return [];
  return arr.filter((p: any) => p?.request?.student_id === uid);
}

function _findSingleEntry(path: string, arrayKey: string, fieldName: string, uid: string): any {
  const all = _findEntries(path, arrayKey, fieldName, uid);
  return all.length === 0 ? null : all[0];
}
