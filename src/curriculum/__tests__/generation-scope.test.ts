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

  it('happens to equal the whole graph today, because gate-ma is the only pack declaring concepts', () => {
    // Deliberately asserted as a coincidence rather than a rule. This used to
    // be `toBe(ALL_CONCEPTS)` — literally the same array — which was correct
    // while the concept graph WAS gate-ma's graph. Now the graph merges every
    // pack, so handing gate-ma ALL_CONCEPTS would pull a second exam's
    // concepts into gate-ma's generation scope. The scope is sourced per-pack;
    // the equality below is a fact about today's data, and the test above is
    // the rule.
    expect(getSyllabus('gate-ma').concepts.length).toBe(ALL_CONCEPTS.length);
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
  it('resolves to zero concepts today — jee-main.yml concept_ids are declared stubs, not yet in the concept graph', () => {
    const syllabus = getSyllabus('jee-main');
    expect(syllabus.id).toBe('jee-main');
    expect(syllabus.concepts).toEqual([]);
    expect(syllabus.unresolvedConceptIds.length).toBeGreaterThan(0);
    expect(syllabus.atomsSubdir).toBe('jee-main');
  });

  it('unresolved ids come from jee-main.yml, e.g. a physics concept id', () => {
    const syllabus = getSyllabus('jee-main');
    expect(syllabus.unresolvedConceptIds).toContain('kinematics-1d');
  });
});

describe('getSyllabus — unknown id', () => {
  it('throws with the registered list in the message', () => {
    expect(() => getSyllabus('not-a-real-exam')).toThrow(/unknown syllabus/);
    expect(() => getSyllabus('not-a-real-exam')).toThrow(/gate-ma/);
  });
});
