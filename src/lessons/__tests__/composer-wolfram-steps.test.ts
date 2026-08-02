/**
 * Composer wolfram-steps enrichment (content-pipeline realignment plan,
 * item 5 consumption point): when the wolfram-verify job has cached
 * step-by-step output for the example problem being rendered, the
 * worked_example component carries a provenance-labeled wolfram_steps
 * enrichment through the wolframAttribution path. Graceful when the
 * cache dir is missing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { composeBase } from '../composer';
import type { SourceBundle } from '../source-resolver';
import { writeWolframSteps } from '../../services/wolfram-steps-cache';

let tmp: string;
let origStepsDir: string | undefined;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'composer-wsteps-'));
  origStepsDir = process.env.VIDHYA_WOLFRAM_STEPS_DIR;
  process.env.VIDHYA_WOLFRAM_STEPS_DIR = path.join(tmp, 'wolfram-steps');
});

afterEach(() => {
  if (origStepsDir === undefined) delete process.env.VIDHYA_WOLFRAM_STEPS_DIR;
  else process.env.VIDHYA_WOLFRAM_STEPS_DIR = origStepsDir;
  fs.rmSync(tmp, { recursive: true, force: true });
});

function makeSources(problems: any[]): SourceBundle {
  return {
    concept_id: 'eigenvalues',
    user_materials: [],
    bundle: { explainer: null, problems },
    wolfram: { verified_example: null },
    graph: {
      id: 'eigenvalues',
      label: 'Eigenvalues & Eigenvectors',
      topic: 'linear-algebra',
      description: 'Characteristic polynomial, computation, properties',
      difficulty_base: 0.5,
      prerequisites: [],
      dependents: [],
    },
    topic_notes: null,
  } as SourceBundle;
}

const MCQ = {
  id: 'p-steps-1',
  concept_id: 'eigenvalues',
  question_text: 'eigenvalues of [[2,0],[0,3]]',
  correct_answer: '2 and 3',
  explanation: 'Diagonal matrix — read off the diagonal.',
  source: 'gate-2024',
  wolfram_verified: true,
};

function workedExample(problems: any[]): any {
  return composeBase(makeSources(problems)).components.find((c) => c.kind === 'worked_example');
}

describe('wolfram_steps enrichment', () => {
  it('attaches cached steps with provenance + wolfram attribution', () => {
    writeWolframSteps('p-steps-1', {
      problem_id: 'p-steps-1',
      query: 'eigenvalues of [[2,0],[0,3]]',
      steps: ['form det(A - λI) = 0', 'solve (2-λ)(3-λ) = 0'],
      answer: 'λ = 2, 3',
      provenance: { source: 'wolfram', query_id: 'abc123abc123abc1', fetched_at: '2026-08-02T00:00:00.000Z' },
    });

    const we = workedExample([MCQ]);
    expect(we).toBeDefined();
    expect(we.presentation).toBe('example_problem');
    expect(we.steps).toEqual([]); // authored steps stay empty — no fabrication
    expect(we.wolfram_steps).toBeDefined();
    expect(we.wolfram_steps.steps).toEqual(['form det(A - λI) = 0', 'solve (2-λ)(3-λ) = 0']);
    expect(we.wolfram_steps.provenance).toEqual({
      source: 'wolfram',
      query_id: 'abc123abc123abc1',
      fetched_at: '2026-08-02T00:00:00.000Z',
    });
    expect(we.wolfram_steps.attribution.kind).toBe('wolfram-computed');
    expect(we.wolfram_steps.attribution.author).toBe('Wolfram Research');
  });

  it('surfaces the wolfram attribution in the lesson-level sources list', () => {
    writeWolframSteps('p-steps-1', {
      problem_id: 'p-steps-1',
      query: 'q',
      steps: ['one step'],
      provenance: { source: 'wolfram', query_id: 'ffffffffffffffff', fetched_at: '2026-08-02T00:00:00.000Z' },
    });
    const lesson = composeBase(makeSources([MCQ]));
    expect(lesson.sources.some((s) => s.kind === 'wolfram-computed')).toBe(true);
  });

  it('is graceful when the cache dir does not exist (no enrichment, no crash)', () => {
    process.env.VIDHYA_WOLFRAM_STEPS_DIR = path.join(tmp, 'never-created');
    const we = workedExample([MCQ]);
    expect(we).toBeDefined();
    expect(we.wolfram_steps).toBeUndefined();
    const lesson = composeBase(makeSources([MCQ]));
    expect(lesson.sources.some((s) => s.kind === 'wolfram-computed')).toBe(false);
  });

  it('ignores a cache entry for a different problem id', () => {
    writeWolframSteps('other-problem', {
      problem_id: 'other-problem',
      query: 'q',
      steps: ['s'],
      provenance: { source: 'wolfram', query_id: '1111111111111111', fetched_at: '2026-08-02T00:00:00.000Z' },
    });
    const we = workedExample([MCQ]);
    expect(we.wolfram_steps).toBeUndefined();
  });

  it('rejects malformed cache entries (empty steps) gracefully', () => {
    const dir = path.join(tmp, 'wolfram-steps');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'p-steps-1.json'), JSON.stringify({
      problem_id: 'p-steps-1', query: 'q', steps: [],
      provenance: { source: 'wolfram', query_id: 'x', fetched_at: 'y' },
    }));
    expect(workedExample([MCQ]).wolfram_steps).toBeUndefined();
    fs.writeFileSync(path.join(dir, 'p-steps-1.json'), 'NOT JSON');
    expect(workedExample([MCQ]).wolfram_steps).toBeUndefined();
  });
});
