/**
 * Tests for src/curriculum/exam-loader.ts's generation-scope resolution
 * (getSyllabus / listSyllabusIds / DEFAULT_SYLLABUS_ID) — relocated from
 * src/jobs/generation-syllabi.ts (deleted, CEO plan §6 registry
 * unification) once concept-graph.ts became a thin loader over
 * data/curriculum/gate-ma.yml, removing the need for a separate job-local
 * adapter. See exam-loader.ts's getSyllabus() docblock for the scope rule
 * (why gate-ma keeps the full concept graph while every other exam is
 * derived from its data/curriculum/<exam>.yml).
 */

import { describe, it, expect } from 'vitest';
import { getSyllabus, listSyllabusIds, DEFAULT_SYLLABUS_ID } from '../exam-loader';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

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

describe('getSyllabus — gate-ma (default, special-cased)', () => {
  it('resolves to the full concept graph, not just what gate-ma.yml links', () => {
    const syllabus = getSyllabus('gate-ma');
    expect(syllabus.id).toBe('gate-ma');
    expect(syllabus.concepts).toBe(ALL_CONCEPTS); // same reference, full graph
    expect(syllabus.concepts.length).toBe(ALL_CONCEPTS.length);
    expect(syllabus.unresolvedConceptIds).toEqual([]);
    expect(syllabus.atomsSubdir).toBe('');
  });

  it('is the default when no id is passed', () => {
    const withDefault = getSyllabus();
    const explicit = getSyllabus('gate-ma');
    expect(withDefault.id).toBe(explicit.id);
    expect(withDefault.concepts).toBe(explicit.concepts);
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
