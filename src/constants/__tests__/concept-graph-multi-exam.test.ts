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
import { conceptScopeForStudent } from '../../curriculum/student-exam-scope';
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

  it('keeps gate-ma at its full 101 while the universe grows around it', () => {
    // The number that must never silently regress is gate-ma's OWN share.
    // The universe total moves whenever a pack is added, by design — this
    // assertion used to read `expect(ALL_CONCEPTS).toHaveLength(101)`, which
    // was the same statement only while one pack declared concepts.
    expect(conceptsDeclaredByExam('gate-ma')).toHaveLength(101);
    expect(ALL_CONCEPTS).toHaveLength(124);
  });

  it('reports jee-main\'s own 23 — the Mathematics half it has migrated', () => {
    // jee-main was a Phase-1 stub owning nothing; its Mathematics concepts
    // are now real nodes. Physics and Chemistry are still stubs, so this
    // number is the migrated half and not the pack's whole syllabus.
    expect(conceptsDeclaredByExam('jee-main')).toHaveLength(23);
  });

  it('partitions the universe — both packs together account for every concept', () => {
    const gate = conceptsDeclaredByExam('gate-ma').map((c) => c.id);
    const jee = conceptsDeclaredByExam('jee-main').map((c) => c.id);
    expect(gate.length + jee.length).toBe(ALL_CONCEPTS.length);
    expect(new Set([...gate, ...jee]).size).toBe(ALL_CONCEPTS.length);
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

describe('exam scoping: the successor to the one-pack tripwire', () => {
  // The test that used to live here asserted that exactly one pack declared
  // concepts, and told whoever turned it red to scope the unfiltered
  // ALL_CONCEPTS reads BEFORE landing a second pack, then delete it.
  //
  // jee-main declaring 23 Mathematics concepts turned it red. The scoping
  // work it demanded is what these tests now hold in place. Deleting the
  // tripwire outright would have thrown away the protection at exactly the
  // moment a THIRD pack becomes possible, so it is replaced rather than
  // removed — the invariant is different, the job is the same.
  //
  // Two mechanisms carry the load, because the broken call sites split into
  // two kinds:
  //
  //   ~20 sites select concepts BY TOPIC STRING. They are made correct by
  //   namespacing: a topic only one pack claims is already exam-scoped, so
  //   those sites keep working unmodified. `ci:topic-namespace` enforces it.
  //
  //   4 sites select by ID or by COUNT, where namespacing buys nothing.
  //   They share one resolver, src/curriculum/student-exam-scope.ts.

  it('no topic string is claimed by two packs', () => {
    const byTopic = new Map<string, Set<string>>();
    for (const c of ALL_CONCEPTS) {
      const owner = CONCEPT_DECLARED_BY.get(c.id);
      if (!owner) continue;
      const owners = byTopic.get(c.topic) ?? new Set<string>();
      owners.add(owner);
      byTopic.set(c.topic, owners);
    }
    const collisions = [...byTopic.entries()]
      .filter(([, owners]) => owners.size > 1)
      .map(([topic, owners]) => `${topic}: ${[...owners].join(' + ')}`);
    expect(collisions).toEqual([]);
  });

  it('the four id-based call sites go through the shared scope resolver', () => {
    // A source grep, deliberately, in the style of the surveillance
    // invariants: it catches the reversal (someone putting an unfiltered
    // ALL_CONCEPTS read back) that no behavioural test would, because with
    // the current two packs a GATE student's recommendations only go wrong
    // once JEE content is what gets recommended.
    const root = path.resolve(__dirname, '../..');
    const wired = [
      'api/readiness-routes.ts',
      'api/quiz-routes.ts',
      'notebook/notebook-store.ts',
      'curriculum/curriculum-repo.ts',
    ];
    const missing = wired.filter((rel) => {
      const src = fs.readFileSync(path.join(root, rel), 'utf8');
      return !src.includes('student-exam-scope');
    });
    expect(missing).toEqual([]);
  });

  it('the shared resolver never hands back an empty scope', () => {
    // An empty allowedNodes deadlocks the readiness engine into `diagnose`
    // and makes a quiz pool impossible to assemble, so every degradation
    // path in conceptScopeForStudent ends wide rather than empty.
    for (const studentId of [null, undefined, '', 'anon_nobody', 'no-such-student']) {
      const scope = conceptScopeForStudent(studentId as string | null);
      expect(scope.conceptIds.length, String(studentId)).toBeGreaterThan(0);
      expect(['registered', 'active-exam', 'whole-graph']).toContain(scope.basis);
    }
  });
});
