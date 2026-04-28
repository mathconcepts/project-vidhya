// @ts-nocheck
/**
 * Unit tests for lifecycle event capture in src/auth/user-store.
 *
 * Verifies that signup, role_changed, and channel_linked events are
 * recorded into the operator analytics adapter as side effects of
 * the corresponding user-store mutations.
 *
 * The events are fire-and-forget (not awaited), so each test:
 *   1. Triggers the mutation
 *   2. Yields to the microtask queue (one tick is enough — the lazy
 *      import + recordEvent are both micro-task chained)
 *   3. Reads the analytics log and asserts on the events
 *
 * What's tested:
 *   - signup event fires on upsertFromGoogle for new users
 *   - signup event captures role, is_bootstrap, email_domain, channels
 *   - signup event does NOT fire on idempotent re-upsert of existing user
 *   - role_changed event fires on actual role change
 *   - role_changed event does NOT fire on no-op (same role assignment)
 *   - channel_linked fires on first link
 *   - channel_linked does NOT fire on idempotent re-link
 *
 * What's NOT tested here:
 *   - Dashboard's lifecycle_events aggregation (covered by operator.test.ts
 *     extension and by live verify)
 *   - Adapter swap (PostHog, Plausible) — that's an integration concern,
 *     not unit-testable without their SDKs
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    process.env.JWT_SECRET = 'unit-test-secret-min-16-chars-please';
  }
  if (existsSync('.data')) {
    savedBackup = `.data.lifecycle-events-testsave-${Date.now()}`;
    cpSync('.data', savedBackup, { recursive: true });
    rmSync('.data', { recursive: true, force: true });
  }
  mkdirSync('.data', { recursive: true });
});

afterAll(() => {
  if (existsSync('.data')) rmSync('.data', { recursive: true, force: true });
  if (savedBackup && existsSync(savedBackup)) {
    cpSync(savedBackup, '.data', { recursive: true });
    rmSync(savedBackup, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  if (existsSync('.data/users.json')) rmSync('.data/users.json');
  if (existsSync('.data/analytics.jsonl')) rmSync('.data/analytics.jsonl');
  // Reset analytics adapter state too
  const a = await import('../../../operator/analytics');
  if (typeof a._resetForTests === 'function') a._resetForTests();
});

/**
 * Wait for the fire-and-forget chain to settle. The chain is:
 *   import('./operator/analytics')  ← microtask 1
 *     .then(() => recordEvent())     ← microtask 2 (calls fs.appendFileSync)
 * Two awaits of immediately-resolving promises drain the queue.
 *
 * In practice we also need to give the async lazy-import a real beat
 * since dynamic import() chains through the module loader.
 */
async function flushFireAndForget() {
  // Multiple ticks — the lazy import + recordEvent chain through several
  // microtasks, and on a cold cache it takes a couple of ticks for the
  // module loader to resolve.
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 5));
  }
}

async function getEvents() {
  const { localAnalyticsAdapter } = await import('../../../operator/analytics');
  return localAnalyticsAdapter.query({});
}

describe('lifecycle events — signup', () => {
  it('fires signup event on first upsertFromGoogle', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    upsertFromGoogle({
      google_sub: 'lifecycle-signup-1',
      email: 'newuser@example.com',
      name: 'New User',
      picture: null,
    });
    await flushFireAndForget();
    const events = await getEvents();
    const signupEvents = events.filter(e => e.event_type === 'signup');
    expect(signupEvents.length).toBe(1);
    expect(signupEvents[0].props?.email_domain).toBe('example.com');
    expect(signupEvents[0].props?.role).toBeDefined();
  });

  it('captures is_bootstrap=true for the very first user', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    const u = upsertFromGoogle({
      google_sub: 'lifecycle-signup-bootstrap',
      email: 'first@example.com',
      name: 'First',
      picture: null,
    });
    await flushFireAndForget();
    const events = await getEvents();
    const e = events.find(x => x.actor_id === u.id);
    expect(e).toBeDefined();
    expect(e!.props?.is_bootstrap).toBe(true);
  });

  it('does NOT fire signup again on idempotent re-upsert', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    upsertFromGoogle({
      google_sub: 'lifecycle-signup-idempotent',
      email: 'idem@example.com',
      name: 'Idem',
      picture: null,
    });
    await flushFireAndForget();
    upsertFromGoogle({
      google_sub: 'lifecycle-signup-idempotent', // same google_sub
      email: 'idem@example.com',
      name: 'Idem Updated',
      picture: null,
    });
    await flushFireAndForget();
    const events = await getEvents();
    const signupEvents = events.filter(e => e.event_type === 'signup');
    expect(signupEvents.length).toBe(1);
  });

  it('redacts the email — only domain is captured, not full address', async () => {
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    upsertFromGoogle({
      google_sub: 'lifecycle-signup-pii',
      email: 'private-name@example.com',
      name: 'Private',
      picture: null,
    });
    await flushFireAndForget();
    const events = await getEvents();
    const e = events.find(x => x.event_type === 'signup');
    expect(e!.props?.email_domain).toBe('example.com');
    // Full email should NOT be in props
    const propsJson = JSON.stringify(e!.props);
    expect(propsJson).not.toContain('private-name@');
    expect(propsJson).not.toContain('private-name');
  });
});

describe('lifecycle events — role_changed', () => {
  it('fires role_changed on actual role transition', async () => {
    const { upsertFromGoogle, setRole } = await import('../../../auth/user-store');
    // Create the bootstrap (owner)
    const owner = upsertFromGoogle({
      google_sub: 'role-owner',
      email: 'owner@example.com',
      name: 'Owner',
      picture: null,
    });
    // Create a target user
    const target = upsertFromGoogle({
      google_sub: 'role-target',
      email: 'target@example.com',
      name: 'Target',
      picture: null,
    });
    await flushFireAndForget();

    // Promote target to teacher
    const result = setRole({
      actor_id: owner.id,
      target_id: target.id,
      new_role: 'teacher',
    });
    expect(result.ok).toBe(true);
    await flushFireAndForget();

    const events = await getEvents();
    const roleEvents = events.filter(e => e.event_type === 'role_changed');
    expect(roleEvents.length).toBe(1);
    expect(roleEvents[0].actor_id).toBe(target.id);
    expect(roleEvents[0].props?.from_role).toBe('student');
    expect(roleEvents[0].props?.to_role).toBe('teacher');
    expect(roleEvents[0].props?.changed_by).toBe(owner.id);
  });

  it('does NOT fire role_changed on no-op (same-role assignment)', async () => {
    const { upsertFromGoogle, setRole } = await import('../../../auth/user-store');
    const owner = upsertFromGoogle({
      google_sub: 'role-noop-owner',
      email: 'owner-noop@example.com',
      name: 'Owner',
      picture: null,
    });
    const target = upsertFromGoogle({
      google_sub: 'role-noop-target',
      email: 'target-noop@example.com',
      name: 'Target',
      picture: null,
    });
    await flushFireAndForget();

    // Assign same role they already have
    setRole({
      actor_id: owner.id,
      target_id: target.id,
      new_role: target.role, // same as current
    });
    await flushFireAndForget();

    const events = await getEvents();
    const roleEvents = events.filter(e => e.event_type === 'role_changed');
    expect(roleEvents.length).toBe(0);
  });
});

describe('lifecycle events — channel_linked', () => {
  it('fires channel_linked on first link', async () => {
    const { upsertFromGoogle, linkChannel } = await import('../../../auth/user-store');
    const u = upsertFromGoogle({
      google_sub: 'channel-link-1',
      email: 'channel@example.com',
      name: 'Channel User',
      picture: null,
    });
    await flushFireAndForget();

    const result = linkChannel({
      user_id: u.id,
      channel: 'telegram',
      channel_specific_id: 'tg-12345',
    });
    expect(result.ok).toBe(true);
    await flushFireAndForget();

    const events = await getEvents();
    const linkEvents = events.filter(e => e.event_type === 'channel_linked');
    expect(linkEvents.length).toBe(1);
    expect(linkEvents[0].actor_id).toBe(u.id);
    expect(linkEvents[0].props?.channel).toBe('telegram');
    expect(linkEvents[0].props?.total_channels).toBeGreaterThanOrEqual(1);
  });

  it('does NOT fire channel_linked on idempotent re-link', async () => {
    const { upsertFromGoogle, linkChannel } = await import('../../../auth/user-store');
    const u = upsertFromGoogle({
      google_sub: 'channel-idempotent',
      email: 'idem-channel@example.com',
      name: 'Idem',
      picture: null,
    });
    await flushFireAndForget();

    linkChannel({ user_id: u.id, channel: 'whatsapp', channel_specific_id: 'wa-1' });
    await flushFireAndForget();

    // Same link again — same channel, same channel_specific_id
    linkChannel({ user_id: u.id, channel: 'whatsapp', channel_specific_id: 'wa-1' });
    await flushFireAndForget();

    const events = await getEvents();
    const linkEvents = events.filter(e => e.event_type === 'channel_linked');
    expect(linkEvents.length).toBe(1);
  });
});

describe('lifecycle events — non-blocking', () => {
  it('user-store mutation succeeds even if analytics fires fail', async () => {
    // We can't easily inject a failing adapter without rearchitecting,
    // but we can verify the key invariant: the mutation returns
    // synchronously (the adapter call doesn't block).
    const { upsertFromGoogle } = await import('../../../auth/user-store');
    const before = Date.now();
    const u = upsertFromGoogle({
      google_sub: 'nonblock-test',
      email: 'nonblock@example.com',
      name: 'Non Blocking',
      picture: null,
    });
    const elapsed = Date.now() - before;
    // Should be well under the analytics fs.appendFile latency (~ms even
    // for a small JSONL append). If user-store awaited the recordEvent,
    // we'd see >5ms here on a slow CI.
    expect(elapsed).toBeLessThan(50);
    expect(u).toBeDefined();
    expect(u.id).toBeTruthy();
  });
});
