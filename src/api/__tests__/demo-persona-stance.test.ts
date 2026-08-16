/**
 * The claim the demo deck makes out loud: two named students open the same
 * concept and do not see the same lesson.
 *
 * Every piece of that was individually fine and the whole thing still failed.
 * `deriveFraming` did not recognise `anxious` — the exact word both persona
 * fixtures use — so Meera resolved as `steady` and read the base body. The
 * persona loaded, the mastery vector reached the composer, the rail walked,
 * and the two journeys were word-for-word identical.
 *
 * So this test starts from the real YAML files and ends at the served body.
 * Nothing between is stubbed, because every stub is somewhere the drift could
 * hide.
 */
import { describe, it, expect } from 'vitest';
import { loadPersona } from '../../scenarios/persona-loader';
import { stanceForSnapshot } from '../lesson-routes';
import { loadConceptAtoms } from '../../content/atom-loader';
import { applyStanceVariants } from '../../content/stance-variants';

/** (persona, concept it walks, the stance the deck is claiming) */
const JOURNEYS: Array<[string, string, 'shaken' | 'assured']> = [
  ['meera-gate-la-anxious', 'eigenvalues', 'shaken'],
  ['meera-gate-la-anxious', 'determinants', 'shaken'],
  ['rahul-gate-rank-push', 'orthogonality', 'assured'],
];

/** The snapshot demo-routes builds from a persona and the client sends back. */
function snapshotFor(personaId: string) {
  const p = loadPersona(personaId);
  return {
    mastery_by_concept: p.seed.initial_mastery,
    motivation_state: p.seed.motivation_state,
    representation_mode: p.seed.representation_mode as never,
  };
}

describe('demo persona → served lesson body', () => {
  for (const [personaId, concept, expected] of JOURNEYS) {
    it(`${personaId} on ${concept} resolves to ${expected}`, () => {
      expect(stanceForSnapshot(snapshotFor(personaId), concept)).toBe(expected);
    });
  }

  it('the two personas read different words on a shared concept', async () => {
    // Both personas carry eigenvalues mastery, so both could walk it. If the
    // bodies match, the deck is narrating two students and showing one lesson.
    const atoms = await loadConceptAtoms('eigenvalues');
    const meera = applyStanceVariants(
      atoms,
      stanceForSnapshot(snapshotFor('meera-gate-la-anxious'), 'eigenvalues'),
    );
    const rahul = applyStanceVariants(
      atoms,
      stanceForSnapshot(snapshotFor('rahul-gate-rank-push'), 'eigenvalues'),
    );

    const differing = atoms.filter((_, i) => meera[i].content !== rahul[i].content);
    expect(differing.length, 'no atom differs between the two personas').toBeGreaterThan(0);

    const hookIdx = atoms.findIndex((a) => a.atom_type === 'hook');
    expect(meera[hookIdx].served_stance).toBe('shaken');
    expect(rahul[hookIdx].served_stance).toBe('assured');
  });

  it('an anonymous visitor with no signal reads the base body', () => {
    // Absent signal must never be read as "this student is struggling".
    expect(stanceForSnapshot(undefined, 'eigenvalues')).toBe('steady');
    expect(stanceForSnapshot({}, 'eigenvalues')).toBe('steady');
  });

  it('mastery alone does not make a confident student assured mid-collapse', () => {
    // High mastery plus an anxious state is a real combination, and the
    // anxiety is the signal that should win.
    expect(
      stanceForSnapshot(
        { mastery_by_concept: { eigenvalues: 0.9 }, motivation_state: 'anxious' },
        'eigenvalues',
      ),
    ).toBe('shaken');
  });

  it('reads mastery for the concept being opened, not the persona average', () => {
    const s = {
      mastery_by_concept: { eigenvalues: 0.9, orthogonality: 0.1 },
      motivation_state: 'steady' as const,
    };
    expect(stanceForSnapshot(s, 'eigenvalues')).toBe('assured');
    expect(stanceForSnapshot(s, 'orthogonality')).toBe('steady');
  });
});
