/**
 * prose-budget-reading-load.test.ts — /design-review (2026-09-03, "content
 * delivery... how to explain more in less"): `countProseWords` strips a
 * `` ```interactive-spec``` `` fence whole, so a resonance-beat scene's
 * `narration_steps` text — the majority of what a student reads on a
 * beat-carrying hook — was invisible to every prose-budget check. These
 * lock the new `countBeatProseWords`/`countTotalReadingLoad` against
 * `resolveBeatText`'s exact per-stance fallback
 * (`frontend/src/components/lesson/interactives/Simulation.tsx`).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { countProseWords, countBeatProseWords, countTotalReadingLoad } from '../prose-budget';
import { _resetInteractiveSpecParserCacheForTests } from '../interactive-spec-loader';

function simulationBody(narration_steps: unknown[], prose = 'Intro sentence.') {
  return [
    prose,
    '',
    '```interactive-spec',
    JSON.stringify({
      v: 1,
      kind: 'simulation',
      title: 'A scene',
      x_expr: 'cos(t)',
      y_expr: 'sin(t)',
      t_min: 0,
      t_max: 6.28,
      narration_steps,
    }),
    '```',
  ].join('\n');
}

describe('countBeatProseWords', () => {
  beforeEach(() => {
    _resetInteractiveSpecParserCacheForTests();
  });

  it('returns 0 for content with no fence at all', async () => {
    expect(await countBeatProseWords('Just plain prose, no scene here.')).toBe(0);
  });

  it('returns 0 for a fence that is not a simulation kind', async () => {
    const body = ['```interactive-spec', JSON.stringify({ v: 1, kind: 'manipulable', title: 'x', formula: 'x' }), '```'].join('\n');
    expect(await countBeatProseWords(body)).toBe(0);
  });

  it('sums the base `text` field across beats when no stance is requested', async () => {
    const body = simulationBody([
      { at_progress: 0, text: 'one two three' },
      { at_progress: 0.5, text: 'four five six seven' },
    ]);
    expect(await countBeatProseWords(body)).toBe(7);
  });

  it('uses text_shaken when stance is shaken and present, falling back to text otherwise', async () => {
    const body = simulationBody([
      { at_progress: 0, text: 'base one two', text_shaken: 'shaken one two three four' },
      { at_progress: 0.5, text: 'base three words' }, // no shaken override on this beat
    ]);
    expect(await countBeatProseWords(body, 'shaken')).toBe(5 + 3);
  });

  it('uses text_assured when stance is assured and present, falling back to text otherwise', async () => {
    const body = simulationBody([
      { at_progress: 0, text: 'base one two', text_assured: 'assured one' },
    ]);
    expect(await countBeatProseWords(body, 'assured')).toBe(2);
  });

  it('includes trap.text and trap.avoid unconditionally (no stance variation on the trap)', async () => {
    const body = simulationBody([
      {
        at_progress: 0.8,
        text: 'reveal beat here',
        trap: { text: 'students think X here', avoid: 'do Y instead now' },
      },
    ]);
    // "reveal beat here" (3) + "students think X here" (4) + "do Y instead now" (4)
    expect(await countBeatProseWords(body)).toBe(11);
  });

  it('strips inline LaTeX from beat text the same way countProseWords does for atom bodies', async () => {
    const body = simulationBody([{ at_progress: 0, text: 'watch $Av=\\lambda v$ happen' }]);
    // "watch" + "happen" — the $...$ span is removed entirely, not counted as a word
    expect(await countBeatProseWords(body)).toBe(2);
  });

  it('returns 0 when the fence is malformed rather than throwing', async () => {
    const body = ['prose', '```interactive-spec', '{ not valid json', '```'].join('\n');
    await expect(countBeatProseWords(body)).resolves.toBe(0);
  });
});

describe('countTotalReadingLoad', () => {
  beforeEach(() => {
    _resetInteractiveSpecParserCacheForTests();
  });

  it('is the sum of the outside-fence prose and the beat text for the requested stance', async () => {
    const body = simulationBody(
      [{ at_progress: 0, text: 'four words go here' }],
      'Three word intro.',
    );
    expect(countProseWords(body)).toBe(3);
    expect(await countBeatProseWords(body)).toBe(4);
    expect(await countTotalReadingLoad(body)).toBe(7);
  });

  it('matches countProseWords alone for an atom with no fence', async () => {
    const body = 'Five simple prose words here.';
    expect(await countTotalReadingLoad(body)).toBe(countProseWords(body));
  });
});
