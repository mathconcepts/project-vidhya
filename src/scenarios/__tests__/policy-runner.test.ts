import { describe, it, expect } from 'vitest';
import { applyPolicy, seededRng, type AtomShape } from '../policy-runner';
import { loadPersona } from '../persona-loader';

const MCQ_ATOM: AtomShape = {
  id: 'limits-jee.mcq.1',
  concept_id: 'limits-jee',
  atom_type: 'mcq',
  options: [
    { id: 'a', text: '0', is_correct: true },
    { id: 'b', text: '1', is_correct: false, distractor_kind: 'algebraic_trap' },
    { id: 'c', text: '∞', is_correct: false, distractor_kind: 'sign_error' },
  ],
};

describe('seededRng', () => {
  it('is deterministic for the same key', () => {
    const a = seededRng('x:y:0');
    const b = seededRng('x:y:0');
    expect(a()).toBeCloseTo(b(), 10);
    expect(a()).toBeCloseTo(b(), 10);
    expect(a()).toBeCloseTo(b(), 10);
  });

  it('diverges across different keys', () => {
    const a = seededRng('x:y:0');
    const b = seededRng('x:y:1');
    expect(a()).not.toBeCloseTo(b(), 5);
  });

  it('produces values in [0, 1)', () => {
    const r = seededRng('seed');
    for (let i = 0; i < 50; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('applyPolicy', () => {
  it('marks interactive atoms as needs_human', () => {
    const persona = loadPersona('priya-cbse-12-anxious');
    const out = applyPolicy({
      persona,
      atom: { ...MCQ_ATOM, has_interactive_spec: true },
      atom_idx: 0,
      mastery: 0.5,
      first_exposure: true,
    });
    expect(out.kind).toBe('needs_human');
  });

  it('marks atoms with no options as needs_human', () => {
    const persona = loadPersona('priya-cbse-12-anxious');
    const out = applyPolicy({
      persona,
      atom: { id: 'x', concept_id: 'limits-jee', atom_type: 'free_text' },
      atom_idx: 0,
      mastery: 0.5,
      first_exposure: true,
    });
    expect(out.kind).toBe('needs_human');
  });

  it('priya picks the algebraic_trap distractor on first exposure (high prob)', () => {
    const persona = loadPersona('priya-cbse-12-anxious');
    // She has p=0.6 on first_exposure; over many seeds the trap is hit a majority.
    let trapHits = 0;
    const N = 50;
    for (let i = 0; i < N; i++) {
      const out = applyPolicy({
        persona: { ...persona, id: `priya-${i}` },  // vary RNG seed via id
        atom: MCQ_ATOM,
        atom_idx: 0,
        mastery: 0.45,
        first_exposure: true,
      });
      if (out.kind === 'answer' && out.via_rule.startsWith('first_exposure:')) {
        trapHits++;
      }
    }
    expect(trapHits / N).toBeGreaterThan(0.4); // ~0.6 expected
  });

  it('arjun (driven, low first-exposure trap prob) usually picks correct', () => {
    const persona = loadPersona('arjun-iit-driven');
    let correctHits = 0;
    const N = 50;
    for (let i = 0; i < N; i++) {
      const out = applyPolicy({
        persona: { ...persona, id: `arjun-${i}` },
        atom: MCQ_ATOM,
        atom_idx: 0,
        mastery: 0.78,
        first_exposure: true,
      });
      if (out.kind === 'answer' && out.correct) correctHits++;
    }
    expect(correctHits / N).toBeGreaterThan(0.7);
  });

  it('produces identical results for identical (persona, concept, atom_idx)', () => {
    const persona = loadPersona('priya-cbse-12-anxious');
    const a = applyPolicy({ persona, atom: MCQ_ATOM, atom_idx: 2, mastery: 0.5, first_exposure: false });
    const b = applyPolicy({ persona, atom: MCQ_ATOM, atom_idx: 2, mastery: 0.5, first_exposure: false });
    expect(a).toEqual(b);
  });
});
