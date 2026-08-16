/**
 * Structural guard for the plan screen's pre-plan state.
 *
 * The page had grown six labelled surfaces above its primary action —
 * explanatory paragraph, two advisory boxes, a saved-templates section, a
 * starter-presets grid, a length picker, a slider, and a save-as-template
 * form — against a design system whose first rule is one focal card per
 * screen. Session length was settable three ways before the student had
 * done anything.
 *
 * Clutter comes back one well-meaning section at a time, and no rendering
 * test fails when it does. These assertions read the source, in the same
 * style as the repo's other invariant tests, and pin the specific decisions
 * rather than a vague notion of tidiness.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = readFileSync(join(__dirname, 'PlannedSessionPage.tsx'), 'utf8');

/** Strip comments so prose describing a rule cannot satisfy or violate it. */
const CODE = SOURCE
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('plan screen — pre-plan layout', () => {
  it('keeps the length slider behind an explicit disclosure', () => {
    // Chips cover the common cases; the slider is under-the-hood.
    expect(CODE).toContain('showCustomMinutes');
    const sliderIdx = CODE.indexOf('type="range"');
    expect(sliderIdx, 'slider not found').toBeGreaterThan(-1);
    // The slider must be inside a showCustomMinutes branch, i.e. the nearest
    // preceding gate is that flag.
    const before = CODE.slice(0, sliderIdx);
    expect(before.lastIndexOf('showCustomMinutes &&')).toBeGreaterThan(
      before.lastIndexOf('!plan && !loading && ('),
    );
  });

  it('keeps saved templates and starter presets behind one folded row', () => {
    expect(CODE).toContain('showStarters');
    for (const marker of ['Your saved templates', 'Starter templates']) {
      const idx = CODE.indexOf(marker);
      expect(idx, `${marker} not found`).toBeGreaterThan(-1);
      expect(CODE.slice(0, idx).lastIndexOf('showStarters &&')).toBeGreaterThan(-1);
    }
  });

  it('does not ask the student to save a template before a plan exists', () => {
    // Save-as-template lives in the plan view now. If it reappears in the
    // pre-plan card it is competing with the primary action again.
    const preplanStart = CODE.indexOf('How long have you got?');
    // Comments are stripped from CODE, so the boundary has to be a code
    // marker. The loading branch is the first thing after the pre-plan
    // region in source order.
    const preplanEnd = CODE.indexOf('{loading && (', preplanStart);
    expect(preplanStart).toBeGreaterThan(-1);
    const preplan = CODE.slice(preplanStart, preplanEnd > preplanStart ? preplanEnd : undefined);
    expect(preplan).not.toContain('setShowSaveTemplate');
  });

  it('still reaches every feature that used to be on the screen', () => {
    // Reduction, not removal. Each of these must remain wired.
    for (const fn of ['useTemplate', 'deleteTemplateFn', 'adoptPreset', 'saveTemplate', 'fetchPlan']) {
      expect(CODE, `${fn} is no longer called`).toContain(`${fn}`);
    }
  });
});

describe('plan screen — design system', () => {
  it('sets no font size as a raw pixel number', () => {
    // DESIGN-SYSTEM.md: the type scale lives in styles/tokens/typography.css.
    // Raw literals are how 10px instructional text got onto a student screen.
    const offenders = [...CODE.matchAll(/fontSize:\s*(\d+)/g)].map((m) => m[1]);
    expect(offenders).toEqual([]);
  });

  it('hard-codes no colour values', () => {
    // "Never hard-code a colour. Use the custom properties."
    const offenders = [
      ...CODE.matchAll(/(?:background|color|border|borderColor)[^,;]*?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g),
    ].map((m) => m[1]);
    expect(offenders).toEqual([]);
  });

  it('gives every tap target in the pre-plan card a 44px floor', () => {
    const start = CODE.indexOf('How long have you got?');
    const end = CODE.indexOf('{loading && (', start);
    expect(start).toBeGreaterThan(-1);
    expect(end, 'loading branch not found after the card').toBeGreaterThan(start);
    const card = CODE.slice(start, end);
    const buttons = card.match(/<button/g)?.length ?? 0;
    const floors = card.match(/minHeight: 'var\(--touch-min\)'/g)?.length ?? 0;
    expect(buttons).toBeGreaterThan(0);
    // Every button in the card carries the floor. Inputs count too, so floors
    // may exceed the button count; it must never fall short.
    expect(floors).toBeGreaterThanOrEqual(buttons);
  });
});
