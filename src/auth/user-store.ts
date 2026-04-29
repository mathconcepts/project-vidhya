// @ts-nocheck
/**
 * User Store — flat-file user directory
 *
 * DB-less: user records live in .data/users.json. Atomic writes via
 * tmp+rename (Node's fs.renameSync is atomic on POSIX and NTFS).
 * Single-writer safe because Node is single-threaded; any concurrent
 * writes serialize through the event loop.
 *
 * Scales comfortably to ~10,000 users. Beyond that, swap this module
 * for a Postgres-backed implementation — the exported API is stable
 * so the rest of the system doesn't change.
 */

import crypto from 'crypto';
import { roleGte, type User, type Role } from './types';
import { createFlatFileStore } from '../lib/flat-file-store';
import { isAuthFeatureEnabled } from '../modules/auth/feature-flags';

const STORE_PATH = '.data/users.json';
const ORG_ID = 'default';

// ============================================================================
// Lifecycle event capture (fire-and-forget)
// ============================================================================
//
// Records signup / channel_linked / role_changed events into the operator
// analytics adapter. Lazy import to avoid a hard dep cycle (operator/
// already imports auth/user-store for listUsers; this is the reverse
// direction). Errors are swallowed — analytics is non-load-bearing,
// must never break the request path.
//
// The adapter today is local-JSONL (writes to .data/analytics-events.jsonl).
// When an operator wires PostHog / Plausible / Segment via a custom
// adapter, these events automatically flow there too — no further
// code changes needed.

function fireLifecycleEvent(event_type: string, actor_id: string | undefined, props?: Record<string, any>) {
  // Async, fire-and-forget. Don't await; don't surface errors.
  // Lazy import via the selector picks PostHog when configured,
  // local-JSONL otherwise. The selector caches; first call resolves.
  import('../operator/analytics-selector')
    .then(({ getAnalyticsAdapter }) => {
      getAnalyticsAdapter().recordEvent({
        event_type,
        at: new Date().toISOString(),
        actor_id,
        props,
      }).catch(() => {});
    })
    .catch(() => {});
}

// ============================================================================
// File layout
// ============================================================================

interface Store {
  version: number;
  org_id: string;
  owner_id: string | null;
  users: Record<string, User>;
}

function emptyStore(): Store {
  return { version: 1, org_id: ORG_ID, owner_id: null, users: {} };
}

const _store = createFlatFileStore<Store>({
  path: STORE_PATH,
  defaultShape: emptyStore,
  isValid: (parsed: any) => parsed && typeof parsed === 'object' && parsed.users,
});

function readStore(): Store { return _store.read(); }
function writeStore(s: Store): void { _store.write(s); }

// ============================================================================
// Lookups
// ============================================================================

export function getUserById(id: string): User | null {
  return readStore().users[id] || null;
}

export function getUserByGoogleSub(sub: string): User | null {
  const store = readStore();
  return Object.values(store.users).find(u => u.google_sub === sub) || null;
}

export function getUserByEmail(email: string): User | null {
  const store = readStore();
  const lower = email.toLowerCase();
  return Object.values(store.users).find(u => u.email.toLowerCase() === lower) || null;
}

export function getUserByChannel(channelId: string): User | null {
  const store = readStore();
  return Object.values(store.users).find(u => u.channels.includes(channelId)) || null;
}

export function listUsers(): User[] {
  return Object.values(readStore().users);
}

export function getOwner(): User | null {
  const store = readStore();
  if (!store.owner_id) return null;
  return store.users[store.owner_id] || null;
}

export function ownerExists(): boolean {
  return !!readStore().owner_id;
}

// ============================================================================
// Create / update
// ============================================================================

function newUserId(): string {
  return 'user_' + crypto.randomBytes(9).toString('base64url');
}

/**
 * Upsert a user from Google identity. First user becomes the owner
 * (bootstrap rule). Subsequent users default to student.
 */
export function upsertFromGoogle(params: {
  google_sub: string;
  email: string;
  name: string;
  picture?: string;
}): User {
  const store = readStore();

  // Try existing by google_sub
  let existing = Object.values(store.users).find(u => u.google_sub === params.google_sub);
  // Also try by email — a user could have signed in via a different method in the past
  if (!existing) {
    existing = Object.values(store.users).find(u => u.email.toLowerCase() === params.email.toLowerCase());
  }

  const now = new Date().toISOString();

  if (existing) {
    // Update last_seen + any profile fields that changed
    existing.last_seen_at = now;
    existing.name = params.name || existing.name;
    existing.picture = params.picture || existing.picture;
    existing.google_sub = params.google_sub; // bind in case of email-first match
    if (!existing.channels.includes('web')) existing.channels.push('web');
    store.users[existing.id] = existing;
    writeStore(store);
    return existing;
  }

  // New user — bootstrap first = owner
  const isBootstrap = !store.owner_id;
  const user: User = {
    id: newUserId(),
    google_sub: params.google_sub,
    email: params.email,
    name: params.name,
    picture: params.picture,
    role: isBootstrap ? 'owner' : 'student',
    teacher_of: [],
    taught_by: null,
    created_at: now,
    last_seen_at: now,
    channels: ['web'],
  };
  store.users[user.id] = user;
  if (isBootstrap) store.owner_id = user.id;
  writeStore(store);

  // Fire signup event. props captures attribution useful for funnel
  // analysis: was this the bootstrap (owner) signup, or a regular
  // student. Email domain is captured but not the email itself —
  // PII-aware by default; an operator who wants full email can
  // inspect users.json directly.
  const emailDomain = params.email.split('@')[1] || 'unknown';
  fireLifecycleEvent('signup', user.id, {
    role: user.role,
    is_bootstrap: isBootstrap,
    email_domain: emailDomain,
    channels: user.channels,
  });

  return user;
}

/** Manual role update with hierarchy validation */
export function setRole(params: {
  actor_id: string;        // who is making the change
  target_id: string;
  new_role: Role;
}): { ok: boolean; reason?: string; user?: User } {
  const store = readStore();
  const actor = store.users[params.actor_id];
  const target = store.users[params.target_id];

  if (!actor) return { ok: false, reason: 'actor not found' };
  if (!target) return { ok: false, reason: 'target not found' };

  // Can't demote yourself
  if (actor.id === target.id) return { ok: false, reason: 'cannot change own role' };

  // Honour role-feature flags. The flag module reads env vars once at
  // boot and exports a sync getter, so a top-level static import is
  // safe and avoids the tsx-ESM `eval('require')` trap.
  if (params.new_role === 'parent' && !isAuthFeatureEnabled('auth.parent_role')) {
    return { ok: false, reason: 'parent role is disabled on this deployment (auth.parent_role=off)' };
  }
  if (params.new_role === 'institution' && !isAuthFeatureEnabled('auth.institution_role')) {
    return { ok: false, reason: 'institution role is disabled on this deployment (auth.institution_role=off — scaffolding only, see PENDING.md §9)' };
  }

  // Only owner can create/demote owners
  if ((params.new_role === 'owner' || target.role === 'owner') && actor.role !== 'owner') {
    return { ok: false, reason: 'only the owner can modify owner role' };
  }

  // Only owner can promote to/demote admin
  if ((params.new_role === 'admin' || target.role === 'admin') && actor.role !== 'owner') {
    return { ok: false, reason: 'only the owner can modify admin role' };
  }

  // Admin can handle teacher/student transitions
  if (!roleGte(actor.role, 'admin')) {
    return { ok: false, reason: 'admin role or higher required' };
  }

  // Promotion/demotion between teacher and student is always fine for admins
  const fromRole = target.role;
  target.role = params.new_role;
  // When demoting teacher → student, unlink their students
  if (params.new_role !== 'teacher') {
    for (const studentId of target.teacher_of) {
      const s = store.users[studentId];
      if (s) s.taught_by = null;
    }
    target.teacher_of = [];
  }
  // When demoting student out of a teacher's roster, just leave it
  writeStore(store);

  // Fire only on actual change (not on no-op same-role assignments).
  // The event's actor_id is the TARGET user (whose role changed) for
  // consistency with signup/channel_linked. The acting admin is in props.
  if (fromRole !== params.new_role) {
    fireLifecycleEvent('role_changed', target.id, {
      from_role: fromRole,
      to_role: params.new_role,
      changed_by: params.actor_id,
    });
  }

  return { ok: true, user: target };
}

/**
 * Transfer ownership. Only the current owner can do this.
 */
export function transferOwnership(params: {
  actor_id: string;
  new_owner_id: string;
}): { ok: boolean; reason?: string } {
  const store = readStore();
  const actor = store.users[params.actor_id];
  const newOwner = store.users[params.new_owner_id];
  if (!actor || actor.role !== 'owner') return { ok: false, reason: 'only the current owner can transfer' };
  if (!newOwner) return { ok: false, reason: 'new owner not found' };
  if (actor.id === newOwner.id) return { ok: false, reason: 'already the owner' };
  // Previous owner becomes admin (doesn't just vanish)
  actor.role = 'admin';
  newOwner.role = 'owner';
  store.owner_id = newOwner.id;
  writeStore(store);
  return { ok: true };
}

/**
 * Assign a student to a teacher. Admin-only action.
 */
export function assignTeacher(params: {
  actor_id: string;
  student_id: string;
  teacher_id: string | null;   // null = unassign
}): { ok: boolean; reason?: string } {
  const store = readStore();
  const actor = store.users[params.actor_id];
  if (!actor || !roleGte(actor.role, 'admin')) {
    return { ok: false, reason: 'admin role required' };
  }
  const student = store.users[params.student_id];
  if (!student || student.role !== 'student') return { ok: false, reason: 'student not found' };

  // Remove from old teacher's roster
  if (student.taught_by) {
    const old = store.users[student.taught_by];
    if (old) old.teacher_of = old.teacher_of.filter(id => id !== student.id);
  }

  if (params.teacher_id === null) {
    student.taught_by = null;
    writeStore(store);
    return { ok: true };
  }

  const teacher = store.users[params.teacher_id];
  if (!teacher || teacher.role !== 'teacher') return { ok: false, reason: 'teacher not found' };

  student.taught_by = teacher.id;
  if (!teacher.teacher_of.includes(student.id)) teacher.teacher_of.push(student.id);
  writeStore(store);
  return { ok: true };
}

/**
 * Link an external channel (telegram/whatsapp) to a user.
 */
export function linkChannel(params: {
  user_id: string;
  channel: 'telegram' | 'whatsapp';
  channel_specific_id: string;
}): { ok: boolean; reason?: string } {
  const store = readStore();
  const user = store.users[params.user_id];
  if (!user) return { ok: false, reason: 'user not found' };
  const channelKey = `${params.channel}:${params.channel_specific_id}`;
  // Check if this channel is already bound to another user
  for (const other of Object.values(store.users)) {
    if (other.id !== user.id && other.channels.includes(channelKey)) {
      return { ok: false, reason: 'channel already linked to another user' };
    }
  }
  if (!user.channels.includes(channelKey)) {
    user.channels.push(channelKey);
    writeStore(store);
    // Fire event only on actual link (not on idempotent re-link)
    fireLifecycleEvent('channel_linked', user.id, {
      channel: params.channel,
      total_channels: user.channels.length,
    });
  } else {
    writeStore(store);
  }
  return { ok: true };
}

export function unlinkChannel(params: {
  user_id: string;
  channel_key: string;    // e.g. "telegram:123456789"
}): { ok: boolean } {
  const store = readStore();
  const user = store.users[params.user_id];
  if (!user) return { ok: false };
  user.channels = user.channels.filter(c => c !== params.channel_key);
  writeStore(store);
  return { ok: true };
}

/**
 * Touch last_seen_at. Lightweight, called by auth middleware.
 */
export function touchUser(user_id: string): void {
  const store = readStore();
  const u = store.users[user_id];
  if (!u) return;
  u.last_seen_at = new Date().toISOString();
  writeStore(store);
}

/**
 * Push a concept to a student's review queue. Idempotent — if already
 * pushed by same teacher, updates pushed_at. Used by
 * POST /api/teaching/push-to-review.
 */
export function pushReviewToStudent(params: {
  student_id: string;
  concept_id: string;
  teacher_id: string;
}): { ok: boolean; reason?: string } {
  const store = readStore();
  const student = store.users[params.student_id];
  if (!student) return { ok: false, reason: 'student not found' };
  if (student.taught_by !== params.teacher_id) {
    return { ok: false, reason: 'not your student' };
  }
  if (!student.pushed_reviews) student.pushed_reviews = [];
  const existing = student.pushed_reviews.find(
    p => p.concept_id === params.concept_id && p.pushed_by_teacher_id === params.teacher_id
  );
  if (existing) {
    existing.pushed_at = new Date().toISOString();
  } else {
    student.pushed_reviews.push({
      concept_id: params.concept_id,
      pushed_by_teacher_id: params.teacher_id,
      pushed_at: new Date().toISOString(),
    });
  }
  writeStore(store);
  return { ok: true };
}

/**
 * Remove a pushed review from a student's queue (on dismiss or complete).
 */
export function dismissPushedReview(params: {
  student_id: string;
  concept_id: string;
}): { ok: boolean } {
  const store = readStore();
  const student = store.users[params.student_id];
  if (!student || !student.pushed_reviews) return { ok: false };
  student.pushed_reviews = student.pushed_reviews.filter(p => p.concept_id !== params.concept_id);
  writeStore(store);
  return { ok: true };
}

/** Get the list of pushed reviews for a student. */
export function listPushedReviews(student_id: string) {
  const u = readStore().users[student_id];
  return u?.pushed_reviews || [];
}
