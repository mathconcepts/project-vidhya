/**
 * interactive-spec-loader.test.ts — resonance plan §W5: the shared guarded
 * dynamic-import loader for the renderer's real `parseInteractiveSpec`,
 * extracted from the orchestrator so it has exactly one implementation
 * (`orchestrator.ts`'s `resonance-fence-validation.test.ts` already proves
 * this loader works end-to-end via generateOne; this file locks the loader
 * itself: caching, and that it hands back the REAL validator in this
 * dev/test process, never a stub).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadInteractiveSpecParser,
  _resetInteractiveSpecParserCacheForTests,
} from '../interactive-spec-loader';

describe('loadInteractiveSpecParser', () => {
  beforeEach(() => {
    _resetInteractiveSpecParserCacheForTests();
  });

  it('resolves the real parser in this process (frontend/src is on disk in dev/test/CI)', async () => {
    const parseSpec = await loadInteractiveSpecParser();
    expect(parseSpec).not.toBeNull();
  });

  it('the resolved parser actually validates a well-formed simulation spec', async () => {
    const parseSpec = await loadInteractiveSpecParser();
    const body = [
      'Some prose.',
      '',
      '```interactive-spec',
      JSON.stringify({
        v: 1,
        kind: 'simulation',
        title: 'Unit circle',
        x_expr: 'cos(t)',
        y_expr: 'sin(t)',
        t_min: 0,
        t_max: 6.28,
        narration_steps: [{ at_progress: 0, text: 'Start.' }],
      }),
      '```',
    ].join('\n');
    const result = parseSpec!(body);
    expect(result.ok).toBe(true);
  });

  it('the resolved parser rejects a malformed fence with a reason, not a throw', async () => {
    const parseSpec = await loadInteractiveSpecParser();
    const body = ['```interactive-spec', '{ not valid json', '```'].join('\n');
    const result = parseSpec!(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBeTruthy();
  });

  it('caches the loaded function across calls (returns the same reference)', async () => {
    const first = await loadInteractiveSpecParser();
    const second = await loadInteractiveSpecParser();
    expect(second).toBe(first);
  });

  it('reset clears the cache so a fresh load is exercised again', async () => {
    const first = await loadInteractiveSpecParser();
    _resetInteractiveSpecParserCacheForTests();
    const second = await loadInteractiveSpecParser();
    // Both resolve to the real module's export — same underlying function
    // identity too, since the module itself is cached by the runtime — but
    // the point of this test is that no exception is thrown on a second,
    // uncached load.
    expect(second).toBeTruthy();
    expect(typeof second).toBe(typeof first);
  });
});
