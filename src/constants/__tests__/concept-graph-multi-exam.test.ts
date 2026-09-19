/**
 * The concept graph across more than one exam pack (Step A).
 *
 * concept-graph.ts used to read exactly one file, `data/curriculum/gate-ma.yml`.
 * Everything adaptive — Elo, FSRS, readiness, prerequisite repair, FIRe, quiz
 * pools, the frontier spine — reads `ALL_CONCEPTS`, so that one line meant a
 * second exam's concepts did not exist to any of them even with a valid pack
 * installed and DEFAULT_EXAM_ID pointing at it.
 *
 * These tests pin the three things that replaced it: the merge, the rule that
 * keeps ids unambiguous, and the distinction between "every concept" and "this
 * exam's concepts" — a distinction that was invisible while only one pack
 * declared anything, and which is exactly where a silent regression would hide.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ALL_CONCEPTS,
  CONCEPT_GRAPH_SOURCES,
  CONCEPT_DECLARED_BY,
  conceptsDeclaredByExam,
  ACTIVE_EXAM_CONCEPT_COUNT,
} from '../concept-graph';
import { CURRICULUM_DIR } from '../../curriculum/active-exam';

describe('merged concept universe', () => {
  it('reports one source row per installed pack', () => {
    const ids = CONCEPT_GRAPH_SOURCES.map((s) => s.exam_id);
    expect(ids).toContain('gate-ma');
    expect(ids).toContain('jee-main');
  });

  it('source counts add up to ALL_CONCEPTS', () => {
    const total = CONCEPT_GRAPH_SOURCES.reduce((sum, s) => sum + s.concept_count, 0);
    expect(total).toBe(ALL_CONCEPTS.length);
  });

  it('attributes every concept to exactly one declaring pack', () => {
    for (const c of ALL_CONCEPTS) {
      expect(CONCEPT_DECLARED_BY.get(c.id)).toBeTypeOf('string');
    }
    expect(CONCEPT_DECLARED_BY.size).toBe(ALL_CONCEPTS.length);
  });

  it('keeps gate-ma at its full 101 — the merge changed nothing today', () => {
    expect(conceptsDeclaredByExam('gate-ma')).toHaveLength(101);
    expect(ALL_CONCEPTS).toHaveLength(101);
  });

  it('reports 0 for a stub pack that declares no concepts of its own', () => {
    // jee-main references shared ids from its syllabus: and owns none. Zero is
    // the honest answer, not something to round up to the graph total.
    expect(conceptsDeclaredByExam('jee-main')).toHaveLength(0);
  });

  it('reports 0 for an exam id that does not exist at all', () => {
    expect(conceptsDeclaredByExam('no-such-exam')).toHaveLength(0);
  });

  it('counts the ACTIVE exam\'s own concepts, not the graph total', () => {
    // With gate-ma active these coincide. The assertion that matters is that
    // the number is sourced per-exam, which the jee-main case above proves.
    expect(ACTIVE_EXAM_CONCEPT_COUNT).toBe(conceptsDeclaredByExam('gate-ma').length);
  });
});

describe('a second pack that declares its own concepts', () => {
  const TEMP_PACK = path.join(CURRICULUM_DIR, 'zz-test-pack.yml');

  afterEach(() => {
    // Guaranteed cleanup: a leftover pack in data/curriculum/ would be loaded
    // by every other test in the suite.
    if (fs.existsSync(TEMP_PACK)) fs.unlinkSync(TEMP_PACK);
    vi.resetModules();
  });

  function writePack(concepts: string): void {
    fs.writeFileSync(
      TEMP_PACK,
      [
        'metadata:',
        '  id: zz-test-pack',
        '  name: Temp Test Pack',
        '  scope: mcq-and-numerical',
        '',
        concepts,
        '',
      ].join('\n'),
      'utf-8',
    );
  }

  it('joins the universe without any code change', async () => {
    writePack(
      [
        'concepts:',
        '  - id: zz-test-only-concept',
        '    topic: zz-test',
        '    label: Test Only Concept',
        '    description: Exists solely to prove a new pack joins the graph.',
        '    difficulty_base: 0.3',
        '    gate_frequency: low',
        '    prerequisites: []',
      ].join('\n'),
    );

    vi.resetModules();
    const fresh = await import('../concept-graph');

    expect(fresh.CONCEPT_MAP.has('zz-test-only-concept')).toBe(true);
    expect(fresh.conceptsDeclaredByExam('zz-test-pack')).toHaveLength(1);
    expect(fresh.ALL_CONCEPTS.length).toBe(ALL_CONCEPTS.length + 1);
  });

  it('may depend on a concept another pack declares', async () => {
    // Cross-pack prerequisites are the point of one shared universe: a new
    // exam builds on concepts that already exist rather than redeclaring them.
    writePack(
      [
        'concepts:',
        '  - id: zz-test-dependent',
        '    topic: zz-test',
        '    label: Depends On GATE Concept',
        '    description: Declares a prerequisite owned by a different pack.',
        '    difficulty_base: 0.4',
        '    gate_frequency: low',
        '    prerequisites: [eigenvalues]',
      ].join('\n'),
    );

    vi.resetModules();
    const fresh = await import('../concept-graph');

    expect(fresh.getPrerequisites('zz-test-dependent').map((c: any) => c.id)).toEqual([
      'eigenvalues',
    ]);
  });

  it('refuses a concept id already declared by another pack, naming both files', async () => {
    // Two definitions of one id would diverge in difficulty/topic/prerequisites
    // depending on load order. Ids are global; declare once, reference anywhere.
    writePack(
      [
        'concepts:',
        '  - id: eigenvalues',
        '    topic: zz-test',
        '    label: Duplicate Eigenvalues',
        '    description: Redeclares an id gate-ma already owns.',
        '    difficulty_base: 0.5',
        '    gate_frequency: low',
        '    prerequisites: []',
      ].join('\n'),
    );

    vi.resetModules();
    await expect(import('../concept-graph')).rejects.toThrow(
      /"eigenvalues" is declared in both .*gate-ma\.yml.* and .*zz-test-pack\.yml/s,
    );
  });
});
