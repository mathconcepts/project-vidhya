import { describe, it, expect } from 'vitest';
import {
  customIdFor,
  buildJobs,
  buildJsonl,
  renderPrompt,
  stableStringify,
} from '../jsonl-builder';
import type { AtomSpec } from '../types';

const SPEC_A: AtomSpec = {
  concept_id: 'limits-jee',
  atom_type: 'mcq',
  difficulty: 'medium',
  prompt_template_id: 'jee-mcq-v1',
  prompt_vars: { count: 1, exam: 'jee-main' },
};

const SPEC_B: AtomSpec = {
  ...SPEC_A,
  concept_id: 'derivatives-basic',
};

describe('customIdFor', () => {
  it('is deterministic for the same (run_id, spec)', () => {
    expect(customIdFor('run-1', SPEC_A)).toBe(customIdFor('run-1', SPEC_A));
  });

  it('differs across runs', () => {
    expect(customIdFor('run-1', SPEC_A)).not.toBe(customIdFor('run-2', SPEC_A));
  });

  it('differs across specs', () => {
    expect(customIdFor('run-1', SPEC_A)).not.toBe(customIdFor('run-1', SPEC_B));
  });

  it('matches the documented format', () => {
    expect(customIdFor('run-1', SPEC_A)).toMatch(/^job-[0-9a-f]{12}$/);
  });

  it('is invariant to prompt_vars key order', () => {
    const reorderedVars: AtomSpec = {
      ...SPEC_A,
      prompt_vars: { exam: 'jee-main', count: 1 }, // same content, swapped order
    };
    expect(customIdFor('r', SPEC_A)).toBe(customIdFor('r', reorderedVars));
  });
});

describe('buildJobs', () => {
  it('dedupes specs that map to the same custom_id', () => {
    const jobs = buildJobs('run-1', [SPEC_A, SPEC_A, SPEC_B]);
    expect(jobs.length).toBe(2);
  });

  it('sorts jobs lexicographically by custom_id', () => {
    const jobs = buildJobs('run-1', [SPEC_B, SPEC_A]);
    const ids = jobs.map((j) => j.custom_id);
    expect([...ids].sort()).toEqual(ids);
  });
});

describe('buildJsonl (determinism)', () => {
  it('same specs → byte-identical JSONL across calls', () => {
    const jobs = buildJobs('run-1', [SPEC_A, SPEC_B]);
    expect(buildJsonl('gemini', jobs)).toBe(buildJsonl('gemini', jobs));
  });

  it('input order does not change the output', () => {
    const a = buildJsonl('gemini', buildJobs('run-1', [SPEC_A, SPEC_B]));
    const b = buildJsonl('gemini', buildJobs('run-1', [SPEC_B, SPEC_A]));
    expect(a).toBe(b);
  });

  it('ends with exactly one trailing newline', () => {
    const jsonl = buildJsonl('gemini', buildJobs('run-1', [SPEC_A]));
    expect(jsonl.endsWith('\n')).toBe(true);
    expect(jsonl.endsWith('\n\n')).toBe(false);
  });

  it('emits one row per job (newline-separated valid JSON)', () => {
    const jobs = buildJobs('run-1', [SPEC_A, SPEC_B]);
    const lines = buildJsonl('gemini', jobs).trim().split('\n');
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('embeds the custom_id in every row', () => {
    const jobs = buildJobs('run-1', [SPEC_A, SPEC_B]);
    const ids = new Set(jobs.map((j) => j.custom_id));
    const jsonl = buildJsonl('gemini', jobs);
    for (const line of jsonl.trim().split('\n')) {
      const parsed = JSON.parse(line);
      expect(ids.has(parsed.custom_id)).toBe(true);
    }
  });

  it('openai shape includes /v1/chat/completions URL', () => {
    const jobs = buildJobs('run-1', [SPEC_A]);
    const row = JSON.parse(buildJsonl('openai', jobs).trim());
    expect(row.url).toBe('/v1/chat/completions');
    expect(row.body.temperature).toBe(0);
  });

  it('anthropic shape includes a model + messages', () => {
    const jobs = buildJobs('run-1', [SPEC_A]);
    const row = JSON.parse(buildJsonl('anthropic', jobs).trim());
    expect(row.params.model).toBeTruthy();
    expect(Array.isArray(row.params.messages)).toBe(true);
  });
});

describe('renderPrompt', () => {
  it('uses rendered_prompt verbatim when supplied', () => {
    const spec: AtomSpec = {
      ...SPEC_A,
      prompt_vars: { rendered_prompt: 'CUSTOM PROMPT BODY' },
    };
    expect(renderPrompt(spec)).toBe('CUSTOM PROMPT BODY');
  });

  it('mentions concept_id, atom_type, and difficulty otherwise', () => {
    const out = renderPrompt(SPEC_A);
    expect(out).toContain('limits-jee');
    expect(out).toContain('mcq');
    expect(out).toContain('medium');
  });

  it('is byte-deterministic for equal specs with shuffled vars', () => {
    const a = renderPrompt(SPEC_A);
    const b = renderPrompt({ ...SPEC_A, prompt_vars: { exam: 'jee-main', count: 1 } });
    expect(a).toBe(b);
  });
});

describe('stableStringify', () => {
  it('sorts object keys alphabetically', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('handles nested objects + arrays', () => {
    expect(stableStringify({ x: [{ b: 2, a: 1 }] })).toBe('{"x":[{"a":1,"b":2}]}');
  });

  it('handles primitives', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(42)).toBe('42');
    expect(stableStringify('s')).toBe('"s"');
  });
});
