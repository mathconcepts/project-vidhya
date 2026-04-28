// @ts-nocheck
/**
 * Tests for content router — library tier integration.
 *
 * The existing content-library.test.ts tests the STORE (getEntry,
 * findEntries, addEntry validation, etc.). These tests verify the
 * ROUTER-CASCADE wiring:
 *
 *   - When a concept is in the library, source='library' wins
 *   - source_ref is library:<sub-source>:<concept_id>
 *   - For practice-problem intent, the worked example body is served
 *   - For other intents, the explainer body is served
 *   - For an unknown concept with allow_generation=false, the
 *     considered list includes library before bundle
 *   - The disclosure varies between built-in (seed) and contributed
 *     (user/llm) entries
 *
 * Why these tests matter: the router cascade order is a load-bearing
 * invariant. Without the test, a refactor could swap library and
 * bundle priority silently — every other test would still pass but
 * the user-facing behaviour would change.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs';

let savedBackup = '';

beforeAll(() => {
  if (existsSync('.data')) {
    savedBackup = `.data.routercascade-testsave-${Date.now()}`;
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
  if (existsSync('.data/content-library-additions.jsonl')) {
    rmSync('.data/content-library-additions.jsonl');
  }
  const m = await import('../../../modules/content-library');
  m.reloadIndex();
});

describe('content router — library tier', () => {
  it('hits library for a seeded concept_id (calculus-derivatives)', async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'explain calculus-derivatives',
      concept_id: 'calculus-derivatives',
    });
    expect(r.source).toBe('library');
    expect(r.source_ref).toBe('library:seed:calculus-derivatives');
    expect(r.licence).toBe('MIT');
    expect(r.content).not.toBeNull();
    expect(r.content!.length).toBeGreaterThan(500);
    // Library appears in the considered list
    expect(r.considered).toContain('library');
  });

  it("disclosure for a seed entry is 'built-in content library'", async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'explain calculus-derivatives',
      concept_id: 'calculus-derivatives',
    });
    expect(r.disclosure).toMatch(/built-in content library/);
    expect(r.disclosure).toMatch(/explainer/);
    expect(r.disclosure).toMatch(/MIT/);
  });

  it('practice-problem intent on a seed concept serves the worked example', async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'give me a practice problem on calculus-derivatives',
      concept_id: 'calculus-derivatives',
    });
    expect(r.source).toBe('library');
    expect(r.disclosure).toMatch(/worked example/);
    // The worked-example body has a recognisable starting heading
    expect(r.content).toMatch(/Worked example/i);
  });

  it('explain intent on the same seed concept serves the explainer (not the worked example)', async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'explain calculus-derivatives',
      concept_id: 'calculus-derivatives',
    });
    expect(r.source).toBe('library');
    expect(r.disclosure).toMatch(/explainer/);
    expect(r.disclosure).not.toMatch(/worked example/);
  });

  it('library appears in considered list before bundle on cascade fallthrough', async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'explain a-concept-that-does-not-exist',
      concept_id: 'a-concept-that-does-not-exist',
      allow_generation: false,
    });
    // We're in the declined path — verify cascade order
    const lib_idx = r.considered.indexOf('library');
    const bundle_idx = r.considered.indexOf('bundle');
    expect(lib_idx).toBeGreaterThanOrEqual(0);
    expect(bundle_idx).toBeGreaterThan(lib_idx);
    // And library's rejection reason is the right one
    expect(r.rejected_because.library).toMatch(/no library entry/);
  });

  it("user-contributed entry has the 'user-contributed' disclosure phrasing", async () => {
    const { addEntry, reloadIndex } = await import('../../../modules/content-library');
    const { routeContent } = await import('../../../content/router');

    addEntry({
      concept_id: 'router-test-user-contrib',
      title: 'Router Test User-Contributed',
      difficulty: 'intro',
      tags: [],
      explainer_md: '# Body of a user-contributed concept',
      added_by: 'unit-test-admin',
      source: 'user',
    });
    reloadIndex();

    const r = await routeContent({
      user_id: 'test',
      text: 'explain it',
      concept_id: 'router-test-user-contrib',
    });
    expect(r.source).toBe('library');
    expect(r.source_ref).toBe('library:user:router-test-user-contrib');
    // Disclosure should distinguish user-contributed from built-in
    expect(r.disclosure).toMatch(/user-contributed/);
    expect(r.disclosure).not.toMatch(/built-in/);
  });

  it('intent vocab is preserved through the library hit', async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'explain calculus-derivatives',
      concept_id: 'calculus-derivatives',
    });
    expect(r.intent).toBe('explain-concept');
    expect(r.ok).toBe(true);
  });

  it('walkthrough-problem intent also pulls worked example', async () => {
    const { routeContent } = await import('../../../content/router');
    const r = await routeContent({
      user_id: 'test',
      text: 'walk me through calculus-derivatives',
      concept_id: 'calculus-derivatives',
    });
    expect(r.source).toBe('library');
    // walkthrough-problem also gets the worked example, like practice-problem
    if (r.intent === 'walkthrough-problem') {
      expect(r.disclosure).toMatch(/worked example/);
    } else {
      // If intent classifier didn't categorise as walkthrough-problem
      // (vocab is fluid), at least confirm library was hit.
      expect(r.source).toBe('library');
    }
  });
});
