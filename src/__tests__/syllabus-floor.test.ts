/**
 * The syllabus floor gate.
 *
 * ── Why this file exists ────────────────────────────────────────────────
 *
 * The gate reported 97 of 97 concepts violating the floor for long enough
 * that someone muted it to `report_only` rather than read it. It was not
 * reporting missing content. It was mis-measuring, in four independent ways,
 * and had no test that would notice:
 *
 *   1. It read `explainers[conceptId]` when the bundle is
 *      `{version, generated_at, total, by_concept}`.
 *   2. `by_concept[id]` is a single OBJECT, so fixing only the path would
 *      have swapped `undefined` for a non-iterable.
 *   3. It required `atom_type !== undefined` on explainer entries, which
 *      carry no `atom_type` field at all — so all 82 real explainers failed.
 *   4. It matched `conceptId.split('-')[0]` against teaching-tips DIRECTORY
 *      names like `01-linear-algebra`, which can never hit.
 *
 * Fixing only #1 would have left every count at zero while looking repaired.
 * These tests assert the gate COUNTS THINGS, not merely that it runs — a
 * checker that always returns zero passes any assertion phrased as
 * "reports a violation".
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  isRealExplainer,
  measureActual,
  loadTeachingTipsIndex,
  loadExplainersJson,
  evaluateFloor,
  loadPracticeCounts,
  PracticeItemParseError,
  SyllabusFloorViolation,
} from '../../scripts/check-syllabus-floor';

const ROOT = process.cwd();

describe('what counts as a real explainer', () => {
  it('accepts a shipped explainer, which carries NO atom_type', () => {
    // The regression. The old filter demanded atom_type and no explainer has
    // one, so this exact shape was rejected 82 times.
    expect(
      isRealExplainer({
        model: 'gate-em-concept-files',
        canonical_definition: 'A sequence is a function from the naturals.',
        deep_explanation: 'Convergence means the tail gets arbitrarily close…',
      }),
    ).toBe(true);
  });

  it('still rejects a placeholder', () => {
    expect(isRealExplainer({ model: 'placeholder', deep_explanation: 'x' })).toBe(false);
  });

  it('rejects an entry with no body, however it is labelled', () => {
    expect(isRealExplainer({ model: 'gate-em-concept-files' })).toBe(false);
    expect(isRealExplainer({ model: 'gate-em-concept-files', deep_explanation: '   ' })).toBe(false);
  });
});

describe('measureActual counts what is actually there', () => {
  const tips = new Set(['linear-algebra']);

  it('counts an explainer supplied in the real single-object shape', async () => {
    const a = await measureActual(
      'eigenvalues',
      { eigenvalues: [{ model: 'gate-em-concept-files', deep_explanation: 'real body' }] },
      tips,
      new Map(),
      'linear-algebra',
    );
    expect(a.explainer_count).toBe(1);
  });

  it('counts verified practice items from the practice bank, not the explainer bundle', async () => {
    // Practice items have never lived in explainers.json. The old code looked
    // for them there and therefore always found zero.
    const a = await measureActual('eigenvalues', {}, tips, new Map([['eigenvalues', 4]]), 'linear-algebra');
    expect(a.verified_practice_count).toBe(4);
  });

  it('matches a strategy card on the concept TOPIC, not an id prefix', async () => {
    const a = await measureActual('eigenvalues', {}, tips, new Map(), 'linear-algebra');
    expect(a.has_strategy_card).toBe(true);
  });

  it('does not claim a strategy card for a topic with no tips', async () => {
    const a = await measureActual('sequences', {}, tips, new Map(), 'calculus');
    expect(a.has_strategy_card).toBe(false);
  });

  it('reports honest zeros when the bundle is absent', async () => {
    const a = await measureActual('eigenvalues', null, new Set(), new Map());
    expect(a).toMatchObject({ explainer_count: 0, verified_practice_count: 0, has_strategy_card: false });
  });
});

describe('against the real corpus', () => {
  const bundle = path.join(ROOT, 'frontend/public/data/explainers.json');
  const have = fs.existsSync(bundle);

  it.runIf(have)('the LOADER reaches into by_concept and normalises to arrays', () => {
    // Also written after a vacuous first attempt: reading the JSON directly
    // and filtering it proved nothing about loadExplainersJson, so restoring
    // the wrong-path bug failed no test. This calls the loader.
    const loaded = loadExplainersJson();
    expect(loaded).not.toBeNull();
    // Metadata keys must not survive as if they were concepts.
    for (const k of ['version', 'generated_at', 'total', 'by_concept']) {
      expect(Object.keys(loaded!), `"${k}" leaked in as a concept`).not.toContain(k);
    }
    expect(Array.isArray(loaded!['sequences'])).toBe(true);
  });

  it.runIf(have)('finds every explainer the bundle claims, rather than reporting zero', () => {
    // The load-bearing assertion, now measured THROUGH the loader. `total` is
    // in the file; a gate that cannot see them is broken whatever else it says.
    const j = JSON.parse(fs.readFileSync(bundle, 'utf-8'));
    const loaded = loadExplainersJson()!;
    const real = Object.values(loaded)
      .flat()
      .filter((e) => isRealExplainer(e as Parameters<typeof isRealExplainer>[0]));
    expect(real.length).toBe(j.total);
    expect(real.length).toBeGreaterThan(50);
  });

  it.runIf(have)('the LOADER strips the numeric prefix, not just the assertion', () => {
    // Written after the first version of this test proved vacuous: it stripped
    // the prefix itself and asserted the result, which held whether or not
    // loadTeachingTipsIndex did the same. Reverting the loader's fix did not
    // fail a single test. This calls the loader.
    const topics = loadTeachingTipsIndex();
    expect(topics.size).toBeGreaterThan(0);
    for (const t of topics) {
      expect(t, `"${t}" still carries its directory ordering prefix`).not.toMatch(/^\d+-/);
    }
    // And the entries are the topics the concept graph actually uses.
    expect(topics.has('linear-algebra')).toBe(true);
    expect(topics.has('01-linear-algebra')).toBe(false);
  });

  it.runIf(have)('every concept topic with tips resolves through measureActual', async () => {
    const topics = loadTeachingTipsIndex();
    const a = await measureActual('eigenvalues', {}, topics, new Map(), 'linear-algebra');
    expect(a.has_strategy_card).toBe(true);
  });
});

describe('loadPracticeCounts — a malformed bank fails loudly (D6 / OV-8)', () => {
  let tmpDir: string;

  function writeFile(name: string, contents: string): void {
    fs.writeFileSync(path.join(tmpDir, name), contents);
  }

  it('counts items with a verification_method, per concept', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-items-'));
    try {
      writeFile('gate-ma-la.json', JSON.stringify({
        items: [
          { id: 'a', concept_id: 'eigenvalues', verification_method: 'wolfram_verified' },
          { id: 'b', concept_id: 'eigenvalues', verification_method: 'dual_model_consensus' },
          { id: 'c', concept_id: 'determinants', verification_method: 'wolfram_verified' },
          // No verification_method — display-only, must not count.
          { id: 'd', concept_id: 'eigenvalues' },
        ],
      }));
      const counts = loadPracticeCounts(tmpDir);
      expect(counts.get('eigenvalues')).toBe(2);
      expect(counts.get('determinants')).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('throws PracticeItemParseError on invalid JSON instead of silently contributing zero', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-items-'));
    try {
      writeFile('broken.json', '{ this is not json');
      expect(() => loadPracticeCounts(tmpDir)).toThrow(PracticeItemParseError);
      try {
        loadPracticeCounts(tmpDir);
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(PracticeItemParseError);
        expect((err as PracticeItemParseError).file).toBe('broken.json');
        expect((err as Error).message).toContain('broken.json');
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('a valid bank alongside a broken one still fails the whole load (never silently drops the broken file to zero)', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-items-'));
    try {
      writeFile('good.json', JSON.stringify({
        items: [{ id: 'a', concept_id: 'eigenvalues', verification_method: 'wolfram_verified' }],
      }));
      writeFile('bad.json', 'not json at all');
      expect(() => loadPracticeCounts(tmpDir)).toThrow(PracticeItemParseError);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('evaluateFloor — D6 per-topic enforcement', () => {
  const manifest = {
    defaults: { explainers: 1, practice_items: 5, strategy_card: true },
    ratchet: 'report_only' as const,
    enforce_topics: ['linear-algebra'],
  };
  const concepts = [
    { id: 'eigenvalues', topic: 'linear-algebra' },
    { id: 'sequences', topic: 'calculus' },
  ];
  // Both concepts have zero of everything — both violate the floor.
  const explainersJson = {};
  const teachingTips = new Set<string>();
  const practiceCounts = new Map<string, number>();

  it('blocks when a violation falls on an enforced topic, even under ratchet=report_only', async () => {
    const evalResult = await evaluateFloor(manifest, concepts, explainersJson, teachingTips, practiceCounts);
    expect(evalResult.violations.length).toBe(2);
    expect(evalResult.enforcedViolations.map((v) => v.concept_id)).toEqual(['eigenvalues']);
    expect(evalResult.reportOnlyViolations.map((v) => v.concept_id)).toEqual(['sequences']);
    expect(evalResult.shouldBlock).toBe(true);
  });

  it('does not block when enforce_topics is empty and ratchet is report_only', async () => {
    const noEnforce = { ...manifest, enforce_topics: [] };
    const evalResult = await evaluateFloor(noEnforce, concepts, explainersJson, teachingTips, practiceCounts);
    expect(evalResult.enforcedViolations.length).toBe(0);
    expect(evalResult.reportOnlyViolations.length).toBe(2);
    expect(evalResult.shouldBlock).toBe(false);
  });

  it('blocks everything when the global ratchet is blocking, independent of enforce_topics', async () => {
    const blocking = { ...manifest, ratchet: 'blocking' as const, enforce_topics: [] };
    const evalResult = await evaluateFloor(blocking, concepts, explainersJson, teachingTips, practiceCounts);
    expect(evalResult.shouldBlock).toBe(true);
  });

  it('a concept meeting the floor never contributes a violation of either kind', async () => {
    const met = new Map([['eigenvalues', 5], ['sequences', 5]]);
    const metExplainers = {
      eigenvalues: [{ model: 'x', deep_explanation: 'body' }],
      sequences: [{ model: 'x', deep_explanation: 'body' }],
    };
    const tips = new Set(['linear-algebra', 'calculus']);
    const evalResult = await evaluateFloor(manifest, concepts, metExplainers, tips, met);
    expect(evalResult.violations).toEqual([]);
    expect(evalResult.shouldBlock).toBe(false);
  });

  it('produces real SyllabusFloorViolation instances', async () => {
    const evalResult = await evaluateFloor(manifest, concepts, explainersJson, teachingTips, practiceCounts);
    expect(evalResult.violations[0]).toBeInstanceOf(SyllabusFloorViolation);
  });
});
