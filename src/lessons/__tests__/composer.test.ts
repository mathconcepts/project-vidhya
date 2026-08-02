/**
 * Composer honesty tests (RC3).
 *
 * Locks the realignment contract:
 *   - MCQ explanations are NEVER split into fake numbered "steps" — MCQs
 *     render as a single honest 'example_problem' card
 *   - a real explainer worked example wins over the MCQ framing
 *   - placeholder explainer prose is never served as intuition; the
 *     topic study guide (topic_notes) is used instead, clearly attributed
 *   - a strategy card appears iff the topic guide has a study strategy
 *   - formal_statement never duplicates canonical_definition
 *   - missing/empty topic_notes shadow paths never crash
 */

import { describe, it, expect } from 'vitest';
import { composeBase } from '../composer';
import type { SourceBundle } from '../source-resolver';

function makeSources(overrides: Partial<SourceBundle> = {}): SourceBundle {
  return {
    concept_id: 'eigenvalues',
    user_materials: [],
    bundle: { explainer: null, problems: [] },
    wolfram: { verified_example: null },
    graph: {
      id: 'eigenvalues',
      label: 'Eigenvalues & Eigenvectors',
      topic: 'linear-algebra',
      description: 'Characteristic polynomial, computation, properties',
      difficulty_base: 0.5,
      prerequisites: [{ id: 'determinants', label: 'Determinants' }],
      dependents: [{ id: 'diagonalization', label: 'Diagonalization' }],
    },
    topic_notes: null,
    ...overrides,
  } as SourceBundle;
}

const MCQ = {
  id: 'p1',
  concept_id: 'eigenvalues',
  question_text: 'The eigenvalues of [[2,0],[0,3]] are?',
  correct_answer: '2 and 3',
  options: ['1 and 6', '2 and 3', '5 and 0', '-2 and -3'],
  explanation: 'The matrix is diagonal. Its eigenvalues are the diagonal entries. Therefore they are 2 and 3.',
  difficulty: 0.3,
  source: 'gate-2024',
  wolfram_verified: true,
};

function findComponent(sources: SourceBundle, kind: string): any {
  return composeBase(sources).components.find(c => c.kind === kind);
}

describe('worked_example — no fake steps (RC3b)', () => {
  it('renders an MCQ as a single example_problem card with zero steps', () => {
    const we = findComponent(makeSources({
      bundle: { explainer: null, problems: [MCQ] } as any,
    }), 'worked_example');
    expect(we).toBeDefined();
    expect(we.presentation).toBe('example_problem');
    expect(we.steps).toEqual([]); // NEVER fabricated step structure
    expect(we.problem).toBe(MCQ.question_text);
    expect(we.options).toEqual(MCQ.options);
    expect(we.final_answer).toBe('2 and 3');
    // Explanation stays one intact prose block — not split on periods
    expect(we.explanation).toBe(MCQ.explanation);
    expect(we.wolfram_verified).toBe(true);
    expect(we.attribution?.kind).toBe('bundle-canon');
  });

  it('uses a real explainer worked example when one exists', () => {
    const we = findComponent(makeSources({
      bundle: {
        explainer: {
          concept_id: 'eigenvalues', topic: 'linear-algebra', label: 'Eigenvalues & Eigenvectors',
          worked_examples: [{ problem: 'Find eigenvalues of [[1,2],[2,1]]', solution: 'Solve det(A-λI)=0: (1-λ)²-4=0 → λ=3,-1', answer: 'λ = 3, -1' }],
        } as any,
        problems: [MCQ],
      } as any,
    }), 'worked_example');
    expect(we.presentation).toBeUndefined(); // real worked presentation
    expect(we.problem).toContain('[[1,2],[2,1]]');
    expect(we.final_answer).toBe('λ = 3, -1');
    expect(we.steps.length).toBe(1); // one authored solution block, not invented boundaries
    expect(we.steps[0].explanation).toContain('det(A-λI)=0');
  });

  it('omits the card entirely when no source exists', () => {
    expect(findComponent(makeSources(), 'worked_example')).toBeUndefined();
  });
});

describe('intuition — placeholder refusal + topic notes (RC3c)', () => {
  const NOTES = {
    topic_id: 'linear-algebra',
    concept_section: null,
    mental_model: 'A matrix is a machine that transforms vectors.',
    study_strategy: 'Day 1-2: matrices. Day 3-5: eigenvalues.',
  };

  it('never serves placeholder deep_explanation; uses topic mental model instead', () => {
    const intuition = findComponent(makeSources({
      bundle: {
        explainer: {
          concept_id: 'eigenvalues', topic: 'linear-algebra', label: 'Eigenvalues & Eigenvectors',
          deep_explanation: 'Eigenvalues & Eigenvectors is a foundational topic in linear algebra.',
          model: 'placeholder',
        } as any,
        problems: [],
      } as any,
      topic_notes: NOTES,
    }), 'intuition');
    expect(intuition).toBeDefined();
    expect(intuition.text).toContain('A matrix is a machine');
    expect(intuition.text).not.toContain('foundational topic'); // placeholder prose rejected
    expect(intuition.text.toLowerCase()).toContain('still expanding'); // honest label
    expect(intuition.attribution?.kind).toBe('topic-notes');
  });

  it('uses a REAL explainer deep_explanation over topic notes', () => {
    const intuition = findComponent(makeSources({
      bundle: {
        explainer: {
          concept_id: 'eigenvalues', topic: 'linear-algebra', label: 'Eigenvalues & Eigenvectors',
          deep_explanation: 'Real generated intuition prose.',
          model: 'gemini-2.5-flash-lite',
        } as any,
        problems: [],
      } as any,
      topic_notes: NOTES,
    }), 'intuition');
    expect(intuition.text).toBe('Real generated intuition prose.');
    expect(intuition.attribution?.kind).toBe('bundle-canon');
  });

  it('prefers the concept-level section over the topic mental model', () => {
    const intuition = findComponent(makeSources({
      topic_notes: { ...NOTES, concept_section: 'Eigenvectors are the axes of the transformation.' },
    }), 'intuition');
    expect(intuition.text).toContain('axes of the transformation');
  });

  it('omits intuition when there is no honest source (no fabrication)', () => {
    expect(findComponent(makeSources(), 'intuition')).toBeUndefined();
    expect(findComponent(makeSources({
      topic_notes: { topic_id: 'linear-algebra', concept_section: null, mental_model: null, study_strategy: null },
    }), 'intuition')).toBeUndefined();
  });
});

describe('strategy card (RC3c)', () => {
  it('renders the topic study strategy with topic-notes attribution', () => {
    const lesson = composeBase(makeSources({
      topic_notes: {
        topic_id: 'linear-algebra',
        concept_section: null,
        mental_model: null,
        study_strategy: 'Day 1-2: matrices and determinants.',
      },
    }));
    const strategy: any = lesson.components.find(c => c.kind === 'strategy');
    expect(strategy).toBeDefined();
    expect(strategy.text).toBe('Day 1-2: matrices and determinants.');
    expect(strategy.attribution?.kind).toBe('topic-notes');
    // Ordering: strategy sits after common_traps position, before connections
    const kinds = lesson.components.map(c => c.kind);
    expect(kinds.indexOf('strategy')).toBeLessThan(kinds.indexOf('connections'));
  });

  it('is omitted when the guide has no study strategy', () => {
    expect(findComponent(makeSources({
      topic_notes: { topic_id: 'linear-algebra', concept_section: null, mental_model: 'x', study_strategy: null },
    }), 'strategy')).toBeUndefined();
    expect(findComponent(makeSources({ topic_notes: null }), 'strategy')).toBeUndefined();
    expect(findComponent(makeSources({ topic_notes: undefined }), 'strategy')).toBeUndefined();
  });
});

describe('formal_statement de-duplication (RC3a)', () => {
  const BASE_EXPLAINER = {
    concept_id: 'eigenvalues', topic: 'linear-algebra', label: 'Eigenvalues & Eigenvectors',
    canonical_definition: 'A scalar λ such that Av = λv for some nonzero v.',
  };

  it('drops the card when it would duplicate canonical_definition verbatim', () => {
    const lesson = composeBase(makeSources({
      bundle: { explainer: { ...BASE_EXPLAINER } as any, problems: [] } as any,
    }));
    const formal = lesson.components.find(c => c.kind === 'formal_statement');
    expect(formal).toBeUndefined();
    // The definition card still carries the canonical text
    const def: any = lesson.components.find(c => c.kind === 'definition');
    expect(def.canonical).toBe(BASE_EXPLAINER.canonical_definition);
  });

  it('keeps the card when a DISTINCT formal statement is authored', () => {
    const formal = findComponent(makeSources({
      bundle: {
        explainer: {
          ...BASE_EXPLAINER,
          formal_statement: 'det(A - λI) = 0 characterises the eigenvalues of A ∈ ℝⁿˣⁿ.',
        } as any,
        problems: [],
      } as any,
    }), 'formal_statement');
    expect(formal).toBeDefined();
    expect(formal.statement).toContain('det(A - λI) = 0');
  });
});

describe('determinism + graceful degradation', () => {
  it('same sources → same lesson (modulo generated_at)', () => {
    const sources = makeSources({ bundle: { explainer: null, problems: [MCQ] } as any });
    const a = composeBase(sources);
    const b = composeBase(sources);
    expect({ ...a, generated_at: '' }).toEqual({ ...b, generated_at: '' });
  });

  it('minimal graph-only sources still produce a lesson without crashing', () => {
    const lesson = composeBase(makeSources());
    const kinds = lesson.components.map(c => c.kind);
    expect(kinds).toContain('hook');
    expect(kinds).toContain('definition');
    expect(kinds).toContain('connections');
  });
});
