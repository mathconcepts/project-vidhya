/**
 * Tests for src/curriculum/exam-loader.ts's generation-scope resolution
 * (getSyllabus / listSyllabusIds / DEFAULT_SYLLABUS_ID) — relocated from
 * src/jobs/generation-syllabi.ts (deleted, CEO plan §6 registry
 * unification) once concept-graph.ts became a thin loader over the exam
 * packs in data/curriculum/, removing the need for a separate job-local
 * adapter. See exam-loader.ts's getSyllabus() docblock for the scope rule:
 * a pack that declares its own `concepts:` block IS its own scope, and a
 * pack that declares none falls back to its `syllabus:` intersected with
 * the graph.
 */

import { describe, it, expect } from 'vitest';
import { getSyllabus, listSyllabusIds, DEFAULT_SYLLABUS_ID } from '../exam-loader';
import {
  ALL_CONCEPTS,
  CONCEPT_DECLARED_BY,
  conceptsDeclaredByExam,
} from '../../constants/concept-graph';

describe('DEFAULT_SYLLABUS_ID', () => {
  it('is gate-ma', () => {
    expect(DEFAULT_SYLLABUS_ID).toBe('gate-ma');
  });
});

describe('listSyllabusIds', () => {
  it('auto-discovers every data/curriculum/*.yml file, including gate-ma and jee-main', () => {
    const ids = listSyllabusIds();
    expect(ids).toContain('gate-ma');
    expect(ids).toContain('jee-main');
  });
});

describe('getSyllabus — gate-ma (declares its own concepts)', () => {
  it('resolves to every concept gate-ma declares, not just what its syllabus: links', () => {
    const syllabus = getSyllabus('gate-ma');
    expect(syllabus.id).toBe('gate-ma');
    expect(syllabus.concepts.map((c) => c.id)).toEqual(
      conceptsDeclaredByExam('gate-ma').map((c) => c.id),
    );
    expect(syllabus.unresolvedConceptIds).toEqual([]);
    expect(syllabus.atomsSubdir).toBe('');
  });

  it('is a strict subset of the merged graph now that a second pack declares concepts', () => {
    // This test previously asserted gate-ma's scope EQUALLED the whole graph,
    // and said in its own comment that it was recording a coincidence rather
    // than a rule — true only while gate-ma was the only pack declaring
    // concepts. jee-main declaring 23 ended the coincidence, exactly as that
    // comment anticipated. The rule it was standing in for is asserted here
    // and in 'never includes a concept another pack declares' below: a pack's
    // generation scope is its OWN concepts, and with more than one pack
    // installed that is strictly smaller than the universe.
    const scope = getSyllabus('gate-ma').concepts;
    expect(scope.length).toBe(101);
    expect(scope.length).toBeLessThan(ALL_CONCEPTS.length);
  });

  it('never includes a concept another pack declares', () => {
    const scopeIds = new Set(getSyllabus('gate-ma').concepts.map((c) => c.id));
    const foreign = ALL_CONCEPTS.filter(
      (c) => CONCEPT_DECLARED_BY.get(c.id) !== 'gate-ma',
    );
    for (const c of foreign) {
      expect(scopeIds.has(c.id)).toBe(false);
    }
  });

  it('is the default when no id is passed', () => {
    const withDefault = getSyllabus();
    const explicit = getSyllabus('gate-ma');
    expect(withDefault.id).toBe(explicit.id);
    // Deep rather than reference equality: the scope is now computed per call
    // from the declaring pack instead of handing back the one shared
    // ALL_CONCEPTS array.
    expect(withDefault.concepts.map((c) => c.id)).toEqual(explicit.concepts.map((c) => c.id));
  });
});

describe('getSyllabus — jee-main (Phase-1 stub, not gate-ma)', () => {
  it('resolves to the 23 Mathematics concepts it now declares', () => {
    // jee-main was a Phase-1 stub: every concept_id its syllabus: named was
    // listed under stub_concepts: and resolved to nothing. Its Mathematics
    // half now declares real nodes, so the scope is those 23 — and the
    // Physics and Chemistry ids, still stubs, are reported as unresolved
    // rather than rounded away. A part-migrated pack must read as
    // part-migrated.
    const syllabus = getSyllabus('jee-main');
    expect(syllabus.concepts).toHaveLength(23);
    expect(syllabus.concepts.map((c) => c.id).sort()).toEqual(
      conceptsDeclaredByExam('jee-main').map((c) => c.id).sort(),
    );
    expect(syllabus.unresolvedConceptIds.length).toBeGreaterThan(0);
    for (const cid of syllabus.unresolvedConceptIds) {
      expect(syllabus.concepts.some((c) => c.id === cid)).toBe(false);
    }
  });
});

describe('getSyllabus — unknown id', () => {
  it('throws with the registered list in the message', () => {
    expect(() => getSyllabus('not-a-real-exam')).toThrow(/unknown syllabus/);
    expect(() => getSyllabus('not-a-real-exam')).toThrow(/gate-ma/);
  });
});
