/**
 * Tests for src/exams/assessment-contract-loader.ts (plan W1.1 + E6).
 *
 * The behaviours worth pinning are all about honesty on the degraded path:
 * a deploy with no database must still grade, must say WHY it fell back,
 * and must stamp a version distinguishable from one that read a real row.
 *
 * These run with no DATABASE_URL — the DB-less shape the demo deploy
 * actually runs in. The DB-read branch is exercised through the exported
 * `validateMarkingBlob`, which is the part of it with logic worth testing;
 * standing up Postgres to prove `SELECT ... WHERE` works would test pg,
 * not this module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resolveAssessmentContract,
  compiledAssessmentContract,
  validateMarkingBlob,
  __resetAssessmentContractCacheForTests,
} from '../assessment-contract-loader';
import {
  COMPILED_ASSESSMENT_CONTRACT,
  COMPILED_CONTRACT_KEY,
  COMPILED_CONTRACT_VERSION,
  DB_CONTRACT_VERSION,
} from '../marking-constants';

const savedDbUrl = process.env.DATABASE_URL;

beforeEach(() => {
  delete process.env.DATABASE_URL;
  __resetAssessmentContractCacheForTests();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  if (savedDbUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = savedDbUrl;
  vi.restoreAllMocks();
});

describe('resolveAssessmentContract — DB-less degradation (E6)', () => {
  it('resolves the compiled contract with no database', async () => {
    const c = await resolveAssessmentContract();
    expect(c.source).toBe('compiled');
    expect(c.exam).toBe(COMPILED_CONTRACT_KEY.exam);
    expect(c.paper).toBe(COMPILED_CONTRACT_KEY.paper);
    expect(c.year).toBe(COMPILED_CONTRACT_KEY.year);
    expect(c.marking).toEqual(JSON.parse(JSON.stringify(COMPILED_ASSESSMENT_CONTRACT.marking)));
  });

  it('stamps a version that is distinguishable from a DB-sourced one', async () => {
    const c = await resolveAssessmentContract();
    expect(c.version).toBe(COMPILED_CONTRACT_VERSION);
    expect(c.version).toBe('gate-2026+compiled');
    expect(c.version).not.toBe(DB_CONTRACT_VERSION);
    expect(c.version.endsWith('+compiled')).toBe(true);
  });

  it('names why it fell back rather than leaving the caller to guess', async () => {
    const c = await resolveAssessmentContract();
    expect(c.fallback_reason).toBe('no DATABASE_URL');
  });

  it('warns exactly once per resolution, naming the key', async () => {
    const warn = vi.spyOn(console, 'warn');
    await resolveAssessmentContract();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('gate/common-em/2026');
  });

  it('never throws on the read path', async () => {
    await expect(resolveAssessmentContract()).resolves.toBeDefined();
    await expect(
      resolveAssessmentContract({ exam: 'nope', paper: 'nope', year: 1999 }),
    ).resolves.toBeDefined();
  });
});

describe('resolveAssessmentContract — a key the compiled contract does not cover', () => {
  it('returns an EMPTY contract rather than another exam\'s numbers', async () => {
    const c = await resolveAssessmentContract({ exam: 'jee', paper: 'advanced-paper-1', year: 2026 });
    expect(c.source).toBe('compiled');
    expect(c.marking).toEqual({});
    expect(c.official_source_url).toBeNull();
    expect(c.verified_at).toBeNull();
    expect(c.fallback_reason).toContain('no compiled contract for this key');
  });

  it('still stamps the +compiled marker so the honesty signal survives', async () => {
    const c = await resolveAssessmentContract({ exam: 'jee', paper: 'advanced-paper-1', year: 2026 });
    expect(c.version).toBe('jee-2026+compiled');
  });
});

describe('resolveAssessmentContract — caching', () => {
  it('caches within the TTL (one warn, not two)', async () => {
    const warn = vi.spyOn(console, 'warn');
    const a = await resolveAssessmentContract();
    const b = await resolveAssessmentContract();
    expect(b).toBe(a);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('forceReload bypasses the cache', async () => {
    const a = await resolveAssessmentContract();
    const b = await resolveAssessmentContract({ ...COMPILED_CONTRACT_KEY }, true);
    expect(b).not.toBe(a);
    expect(b).toEqual(a);
  });

  it('caches per key, not globally', async () => {
    const gate = await resolveAssessmentContract();
    const other = await resolveAssessmentContract({ exam: 'jee', paper: 'main', year: 2026 });
    expect(other).not.toBe(gate);
    expect(other.marking).toEqual({});
    expect(gate.marking).not.toEqual({});
  });
});

describe('compiledAssessmentContract', () => {
  it('hands back a clone — a mutating caller cannot corrupt the constant', () => {
    const a = compiledAssessmentContract();
    delete (a.marking as Record<string, unknown>).mcq;
    const b = compiledAssessmentContract();
    expect(b.marking.mcq).toBeDefined();
    expect(COMPILED_ASSESSMENT_CONTRACT.marking.mcq).toBeDefined();
  });
});

describe('validateMarkingBlob', () => {
  const good = JSON.parse(JSON.stringify(COMPILED_ASSESSMENT_CONTRACT.marking));

  it('accepts the compiled marking blob', () => {
    expect(validateMarkingBlob(good)).toBeNull();
  });

  it('rejects a non-object', () => {
    expect(validateMarkingBlob(null)).toMatch(/not a JSON object/);
    expect(validateMarkingBlob('mcq')).toMatch(/not a JSON object/);
    expect(validateMarkingBlob([])).toMatch(/not a JSON object/);
  });

  it('rejects an empty blob — a contract with no question types marks nothing', () => {
    expect(validateMarkingBlob({})).toMatch(/no question types/);
  });

  it('names the offending question type when a strategy id is missing', () => {
    expect(validateMarkingBlob({ mcq: { params: {} } })).toBe(
      'marking.mcq.strategy is missing or not a non-empty string',
    );
    expect(validateMarkingBlob({ msq: { strategy: '  ', params: {} } })).toBe(
      'marking.msq.strategy is missing or not a non-empty string',
    );
  });

  it('names the offending question type when params are missing or wrong-shaped', () => {
    expect(validateMarkingBlob({ nat: { strategy: 'gate_2026' } })).toBe(
      'marking.nat.params is missing or not a JSON object',
    );
    expect(validateMarkingBlob({ nat: { strategy: 'gate_2026', params: [] } })).toBe(
      'marking.nat.params is missing or not a JSON object',
    );
  });

  it('does NOT reject an unregistered strategy id — that refusal belongs to the registry', () => {
    // The loader validates SHAPE. Whether 'jee_adv_2027' is a strategy this
    // build can run is resolveMarkingStrategy's question, and its refusal
    // can name the known ids; the loader's cannot.
    expect(validateMarkingBlob({ mcq: { strategy: 'jee_adv_2027', params: {} } })).toBeNull();
  });
});
