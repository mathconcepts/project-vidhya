/**
 * content-generation job tests (content-pipeline realignment plan,
 * item 4): the job REFUSES to start without GEMINI_API_KEY — generating
 * stub/placeholder atoms is banned. Plus the FILE-mode atom serializer
 * matches the authored atom format the atom-loader parses.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import matter from 'gray-matter';
import { startJob, __testing as runnerTesting } from '../job-runner';
import {
  CONTENT_GENERATION_JOB,
  conceptHasAtoms,
  renderAtomFile,
} from '../content-generation-job';

let tmp: string;
const savedEnv: Record<string, string | undefined> = {};
const ENV_KEYS = ['VIDHYA_JOBS_DIR', 'VIDHYA_CONCEPTS_ROOT', 'GEMINI_API_KEY', 'CONTENT_JOBS_DISABLED'];

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-gen-'));
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.VIDHYA_JOBS_DIR = path.join(tmp, 'jobs');
  process.env.VIDHYA_CONCEPTS_ROOT = path.join(tmp, 'concepts');
  delete process.env.GEMINI_API_KEY;
  delete process.env.CONTENT_JOBS_DISABLED;
  runnerTesting.resetRuntimeForTests();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('preflight refusal without GEMINI_API_KEY', () => {
  it('refuses to start with a clear message — stub atoms are banned', async () => {
    const r = await startJob(CONTENT_GENERATION_JOB);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('refused');
      expect(r.message).toContain('GEMINI_API_KEY');
      expect(r.message.toLowerCase()).toContain('placeholder');
    }
    // Nothing was generated and no atoms directory was fabricated.
    expect(fs.existsSync(path.join(tmp, 'concepts'))).toBe(false);
  });

  it('the kill switch takes precedence over the preflight message', async () => {
    process.env.CONTENT_JOBS_DISABLED = 'true';
    const r = await startJob(CONTENT_GENERATION_JOB);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('disabled');
  });
});

describe('conceptHasAtoms', () => {
  it('is false for a missing dir and true once an atom .md exists', () => {
    expect(conceptHasAtoms('limits')).toBe(false);
    const atomsDir = path.join(tmp, 'concepts', 'limits', 'atoms');
    fs.mkdirSync(atomsDir, { recursive: true });
    expect(conceptHasAtoms('limits')).toBe(false); // empty dir → still no atoms
    fs.writeFileSync(path.join(atomsDir, 'hook.md'), '---\nid: limits.hook\n---\nbody');
    expect(conceptHasAtoms('limits')).toBe(true);
  });
});

describe('renderAtomFile (FILE mode format)', () => {
  it('serializes frontmatter the atom-loader parses (id, concept_id, atom_type, bloom_level, difficulty, exam_ids)', () => {
    const raw = renderAtomFile({
      atom_id: 'limits.worked-example',
      concept_id: 'limits',
      atom_type: 'worked_example',
      bloom_level: 3,
      difficulty: 0.5,
      exam_ids: ['*'],
      content: 'Evaluate $\\lim_{x\\to 0} \\frac{\\sin x}{x}$.\n\n---\n\nAnswer: 1',
      meta: {
        source_cascade: ['llm-claude'],
        wolfram_grounded: false,
        pyq_grounded: [],
        generated_at: '2026-08-02T00:00:00.000Z',
        cost_usd: 0.03,
      },
    } as any);

    const parsed = matter(raw);
    expect(parsed.data.id).toBe('limits.worked-example');
    expect(parsed.data.concept_id).toBe('limits');
    expect(parsed.data.atom_type).toBe('worked_example');
    expect(parsed.data.bloom_level).toBe(3);
    expect(parsed.data.difficulty).toBe(0.5);
    expect(parsed.data.exam_ids).toEqual(['*']);
    expect(parsed.data.generated_by).toBe('concept-orchestrator');
    expect(parsed.content.trim()).toContain('Answer: 1');
  });
});
