/**
 * PedagogyEngine — tier selection + E5/E6/exam-overlay branches.
 *
 * Pure-function tests (no DB, no I/O). Builds synthetic atom sets and
 * verifies selectAtoms() returns the expected ordering for each tier and
 * each expansion (error streak, exam countdown, exam overlay filter,
 * wildcard atom rule).
 */

import { describe, it, expect } from 'vitest';
import {
  selectAtoms,
  classifyMastery,
  readMasteryScore,
  type MasteryTier,
} from '../pedagogy-engine';
import type { ContentAtom, AtomType, SessionContext, RouteRequest } from '../content-types';
import type { ConceptMeta } from '../../curriculum/types';
import type { StudentModel } from '../../gbrain/student-model';

// ─── Fixtures ───────────────────────────────────────────────────────────

function atom(id: string, atom_type: AtomType, opts: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id,
    concept_id: 'calculus-derivatives',
    atom_type,
    bloom_level: 2,
    difficulty: 0.0,
    exam_ids: ['*'],
    content: `content-${id}`,
    ...opts,
  };
}

const allTypes: AtomType[] = [
  'hook', 'intuition', 'formal_definition', 'visual_analogy',
  'worked_example', 'micro_exercise', 'common_traps',
  'retrieval_prompt', 'interleaved_drill', 'mnemonic', 'exam_pattern',
];

function fullAtomSet(): ContentAtom[] {
  return allTypes.map((t, i) => atom(`a-${t}`, t, { difficulty: 0.0 + i * 0.01 }));
}

const baseMeta: ConceptMeta = { concept_id: 'calculus-derivatives' };
const baseSession: SessionContext = { error_streak: 0, last_error_atom_type: null };
const baseRouteRequest: RouteRequest = { user_id: 'u', text: '', concept_id: 'calculus-derivatives' };

function studentWithMastery(score: number): StudentModel {
  return {
    id: 'sm-1',
    session_id: 's-1',
    user_id: null,
    mastery_vector: { 'calculus-derivatives': { score, attempts: 1, correct: 1, last_update: '' } },
    speed_profile: {},
    prerequisite_alerts: [],
  } as any;
}

// ─── Mastery classification ─────────────────────────────────────────────

describe('classifyMastery', () => {
  it('classifies mastery 0 as cold', () => {
    expect(classifyMastery(0)).toBe<MasteryTier>('cold');
  });
  it('classifies mastery 0.29 as cold', () => {
    expect(classifyMastery(0.29)).toBe<MasteryTier>('cold');
  });
  it('classifies mastery 0.30 as building (boundary)', () => {
    expect(classifyMastery(0.30)).toBe<MasteryTier>('building');
  });
  it('classifies mastery 0.60 as solidifying', () => {
    expect(classifyMastery(0.60)).toBe<MasteryTier>('solidifying');
  });
  it('classifies mastery 0.85 as exam-ready', () => {
    expect(classifyMastery(0.85)).toBe<MasteryTier>('exam-ready');
  });
});

describe('readMasteryScore', () => {
  it('returns 0 for null model', () => {
    expect(readMasteryScore(null, 'calculus-derivatives')).toBe(0);
  });
  it('returns 0 for missing concept', () => {
    const m = studentWithMastery(0.5);
    expect(readMasteryScore(m, 'unknown-concept')).toBe(0);
  });
  it('reads MasteryEntry.score', () => {
    const m = studentWithMastery(0.7);
    expect(readMasteryScore(m, 'calculus-derivatives')).toBe(0.7);
  });
});

// ─── Tier ordering ──────────────────────────────────────────────────────

describe('selectAtoms — tier ordering', () => {
  const atoms = fullAtomSet();

  it('cold tier serves hook/intuition first', () => {
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.0),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].atom_type).toBe('hook');
    expect(result[1].atom_type).toBe('intuition');
  });

  it('building tier serves formal_definition first', () => {
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.45),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('formal_definition');
    expect(result.find((a) => a.atom_type === 'worked_example')).toBeDefined();
  });

  it('solidifying tier serves common_traps first', () => {
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.7),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('common_traps');
  });

  it('exam-ready tier serves retrieval_prompt first', () => {
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.9),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('retrieval_prompt');
  });

  it('skips missing atom types silently', () => {
    const reduced = atoms.filter((a) => a.atom_type !== 'intuition' && a.atom_type !== 'hook');
    const result = selectAtoms({
      conceptAtoms: reduced,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.0),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result.find((a) => a.atom_type === 'hook' || a.atom_type === 'intuition')).toBeUndefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty when given empty input', () => {
    const result = selectAtoms({
      conceptAtoms: [],
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result).toEqual([]);
  });
});

// ─── E5: Error Streak Modality Switch ───────────────────────────────────

describe('selectAtoms — E5 error streak', () => {
  it('streak < 3 does not inject common_traps', () => {
    const atoms = fullAtomSet();
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 2, last_error_atom_type: null },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).not.toBe('common_traps');
  });

  it('streak >= 3 injects common_traps first', () => {
    const atoms = fullAtomSet();
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 3, last_error_atom_type: 'micro_exercise' },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('common_traps');
  });

  it('streak fallback chain prefers visual_analogy', () => {
    const atoms = fullAtomSet();
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 3, last_error_atom_type: null },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('common_traps');
    expect(result[1].atom_type).toBe('visual_analogy');
  });

  it('falls through to mnemonic when visual_analogy missing', () => {
    const atoms = fullAtomSet().filter((a) => a.atom_type !== 'visual_analogy');
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 3, last_error_atom_type: null },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('common_traps');
    expect(result[1].atom_type).toBe('mnemonic');
  });

  it('falls through to worked_example when both visual_analogy and mnemonic missing', () => {
    const atoms = fullAtomSet().filter(
      (a) => a.atom_type !== 'visual_analogy' && a.atom_type !== 'mnemonic',
    );
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 3, last_error_atom_type: null },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('common_traps');
    expect(result[1].atom_type).toBe('worked_example');
  });

  it('serves common_traps alone when no fallback modalities exist', () => {
    const atoms = fullAtomSet().filter(
      (a) => !['visual_analogy', 'mnemonic', 'worked_example'].includes(a.atom_type),
    );
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 4, last_error_atom_type: null },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('common_traps');
  });
});

// ─── E6: Exam Countdown Mode ────────────────────────────────────────────

describe('selectAtoms — E6 exam countdown', () => {
  it('< 21 days reorders to exam_pattern first', () => {
    const atoms = fullAtomSet();
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 0, last_error_atom_type: null },
      routeRequest: { ...baseRouteRequest, exam_proximity_days: 14 },
    });
    expect(result[0].atom_type).toBe('exam_pattern');
  });

  it('>= 21 days uses tier-default ordering', () => {
    const atoms = fullAtomSet();
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 0, last_error_atom_type: null },
      routeRequest: { ...baseRouteRequest, exam_proximity_days: 30 },
    });
    expect(result[0].atom_type).toBe('formal_definition');
  });

  it('null exam_proximity_days uses tier-default ordering', () => {
    const atoms = fullAtomSet();
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.5),
      sessionContext: { error_streak: 0, last_error_atom_type: null },
      routeRequest: baseRouteRequest,
    });
    expect(result[0].atom_type).toBe('formal_definition');
  });
});

// ─── ExamOverlay filtering ──────────────────────────────────────────────

describe('selectAtoms — exam overlay', () => {
  it('skip_atom_types filters out matching types (non-wildcard atoms)', () => {
    const atoms = fullAtomSet().map((a) => ({ ...a, exam_ids: ['EXM-GATE-CS'] }));
    const meta: ConceptMeta = {
      concept_id: 'calculus-derivatives',
      exam_overlays: {
        'EXM-GATE-CS': {
          required_bloom_levels: [1, 2, 3, 4, 5, 6],
          emphasis: 'standard',
          skip_atom_types: ['mnemonic', 'visual_analogy'],
        },
      },
    };
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: meta,
      studentModel: studentWithMastery(0.5),
      sessionContext: baseSession,
      routeRequest: { ...baseRouteRequest, preferred_exam_id: 'EXM-GATE-CS' },
    });
    expect(result.find((a) => a.atom_type === 'mnemonic')).toBeUndefined();
    expect(result.find((a) => a.atom_type === 'visual_analogy')).toBeUndefined();
  });

  it('wildcard ["*"] atoms bypass skip_atom_types', () => {
    const atoms: ContentAtom[] = [
      atom('w-mnem', 'mnemonic', { exam_ids: ['*'] }),
      atom('w-fdef', 'formal_definition', { exam_ids: ['*'] }),
    ];
    const meta: ConceptMeta = {
      concept_id: 'calculus-derivatives',
      exam_overlays: {
        'EXM-GATE-CS': {
          required_bloom_levels: [1, 2, 3, 4, 5, 6],
          emphasis: 'standard',
          skip_atom_types: ['mnemonic'],
        },
      },
    };
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: meta,
      studentModel: studentWithMastery(0.5),
      sessionContext: baseSession,
      routeRequest: { ...baseRouteRequest, preferred_exam_id: 'EXM-GATE-CS' },
    });
    expect(result.find((a) => a.atom_type === 'mnemonic')).toBeDefined();
  });

  it('required_bloom_levels filters out atoms below threshold', () => {
    const atoms = [
      atom('a-low', 'formal_definition', { bloom_level: 1 }),
      atom('a-mid', 'formal_definition', { bloom_level: 3, id: 'a-mid' }),
    ];
    const meta: ConceptMeta = {
      concept_id: 'calculus-derivatives',
      exam_overlays: {
        'EXM-GATE-CS': {
          required_bloom_levels: [3, 4],
          emphasis: 'deep',
          skip_atom_types: [],
        },
      },
    };
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: meta,
      studentModel: studentWithMastery(0.5),
      sessionContext: baseSession,
      routeRequest: { ...baseRouteRequest, preferred_exam_id: 'EXM-GATE-CS' },
    });
    expect(result.find((a) => a.id === 'a-low')).toBeUndefined();
    expect(result.find((a) => a.id === 'a-mid')).toBeDefined();
  });
});

// ─── Difficulty filter ──────────────────────────────────────────────────

describe('selectAtoms — difficulty filter', () => {
  it('serves only atoms within mastery + 0.25 buffer', () => {
    const atoms = [
      atom('easy', 'formal_definition', { difficulty: 0.1 }),
      atom('mid', 'formal_definition', { difficulty: 0.5 }),
      atom('hard', 'formal_definition', { difficulty: 0.9 }),
    ];
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.4),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result.find((a) => a.id === 'easy')).toBeDefined();
    expect(result.find((a) => a.id === 'mid')).toBeDefined();
    expect(result.find((a) => a.id === 'hard')).toBeUndefined();
  });

  it('falls back to unfiltered set if difficulty filter empties results', () => {
    const atoms = [atom('hard', 'formal_definition', { difficulty: 0.9 })];
    const result = selectAtoms({
      conceptAtoms: atoms,
      conceptMeta: baseMeta,
      studentModel: studentWithMastery(0.0),
      sessionContext: baseSession,
      routeRequest: baseRouteRequest,
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('hard');
  });
});
