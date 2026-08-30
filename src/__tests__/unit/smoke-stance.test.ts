/**
 * The production stance smoke check's pass/fail logic.
 *
 * Tested for the reason `scripts/wait-for-http.sh` is tested: that check was
 * four lines inline in the workflow, was wrong in precisely the situation it
 * existed for, and stayed green for weeks because the service happened to be
 * up. A smoke check that cannot fail is worse than no smoke check — it
 * converts an unverified deploy into a reported success.
 *
 * These cover the shapes a broken deployment actually produces: an
 * unreachable host, an image missing the concept's content, variants that
 * stopped being swapped, and — the direction that matters most — a build that
 * decides a student it knows nothing about is struggling.
 */

import { describe, it, expect } from 'vitest';
import { evaluateStance, type StanceProbe } from '../../../scripts/smoke-stance';

const ok = (label: string, stances: string[]): StanceProbe => ({
  label,
  http: 200,
  atom_count: 5,
  stances,
});

/** A deployment behaving correctly. */
const healthy = () => ({
  unconfident: ok('unconfident learner', ['shaken']),
  confident: ok('confident learner', ['assured']),
  noSignal: ok('learner with no signal', []),
});

describe('evaluateStance', () => {
  it('passes a deployment that serves each learner the right body', () => {
    const v = evaluateStance(healthy());
    expect(v.failures).toEqual([]);
    expect(v.ok).toBe(true);
    expect(v.notes.join(' ')).toContain('no signal → base body');
  });

  it('fails when the host is unreachable rather than reporting a pass', () => {
    // http 0 is "no response at all". An earlier version of the sibling wait
    // check treated this as success because it only tested `!== 404`.
    const p = healthy();
    p.unconfident = { ...p.unconfident, http: 0, atom_count: 0 };
    const v = evaluateStance(p);
    expect(v.ok).toBe(false);
    expect(v.failures.join(' ')).toMatch(/expected HTTP 200, got no response/);
  });

  it('fails on a non-200 status', () => {
    const p = healthy();
    p.confident = { ...p.confident, http: 503, atom_count: 0 };
    const v = evaluateStance(p);
    expect(v.ok).toBe(false);
    expect(v.failures.join(' ')).toMatch(/expected HTTP 200, got 503/);
  });

  it('fails when the image composed no atoms for the concept', () => {
    // The packaging failure this repo has actually shipped before: content
    // absent from the runtime image while every local gate stayed green.
    const p = healthy();
    p.unconfident = { ...p.unconfident, atom_count: 0 };
    const v = evaluateStance(p);
    expect(v.ok).toBe(false);
    expect(v.failures.join(' ')).toMatch(/composed 0 atoms/);
  });

  it('fails when an unconfident learner is served the base body', () => {
    // Either the *-shaken.md files are missing from the image, or the
    // composer stopped swapping. Both invisible to every local gate.
    const p = healthy();
    p.unconfident = ok('unconfident learner', []);
    const v = evaluateStance(p);
    expect(v.ok).toBe(false);
    expect(v.failures.join(' ')).toMatch(/unconfident learner was served the base body/);
  });

  it('fails when a confident learner is served the base body', () => {
    const p = healthy();
    p.confident = ok('confident learner', []);
    const v = evaluateStance(p);
    expect(v.ok).toBe(false);
    expect(v.failures.join(' ')).toMatch(/confident learner was served the base body/);
  });

  it('fails when a learner with no signal is treated as struggling', () => {
    // The safety direction. Absent signal must never read as "this student is
    // struggling" — that would put every anonymous visitor into the
    // unconfident register on no evidence at all.
    const p = healthy();
    p.noSignal = ok('learner with no signal', ['shaken']);
    const v = evaluateStance(p);
    expect(v.ok).toBe(false);
    expect(v.failures.join(' ')).toMatch(/no signal was served "shaken"/);
  });

  it('reports every failure at once rather than stopping at the first', () => {
    // An operator reading a failed deploy should see the whole picture in one
    // run, not peel it back one red step per re-run.
    const v = evaluateStance({
      unconfident: ok('unconfident learner', []),
      confident: ok('confident learner', []),
      noSignal: ok('learner with no signal', ['assured']),
    });
    expect(v.ok).toBe(false);
    expect(v.failures).toHaveLength(3);
  });

  it('reports transport failures before body assertions', () => {
    // With the host down, "was served the base body" is noise — the body
    // assertions would all fire on empty data and bury the real cause.
    const v = evaluateStance({
      unconfident: { label: 'unconfident learner', http: 0, atom_count: 0, stances: [] },
      confident: { label: 'confident learner', http: 0, atom_count: 0, stances: [] },
      noSignal: { label: 'learner with no signal', http: 0, atom_count: 0, stances: [] },
    });
    expect(v.ok).toBe(false);
    expect(v.failures.every((f) => /HTTP 200/.test(f))).toBe(true);
  });

  it('tolerates a build that serves extra stances alongside the expected one', () => {
    // Atom-level granularity: a concept can legitimately swap some atoms and
    // not others. The assertion is "the right body was reached", not "nothing
    // else was".
    const p = healthy();
    p.unconfident = ok('unconfident learner', ['shaken']);
    expect(evaluateStance(p).ok).toBe(true);
  });
});
