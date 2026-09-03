/**
 * scripts/check-reading-load.ts — pure-function unit tests. The script
 * itself is report-only (measures the whole corpus, never exits non-zero),
 * so this locks the one non-trivial pure helper — kebab-case filename to
 * snake_case AtomType + stance — rather than spawning the full script
 * against a fixture tree the way check-la-walkthrough.test.ts does for its
 * blocking gate.
 */
import { describe, it, expect } from 'vitest';
import { stanceAndAtomTypeFromFilename } from '../../../../scripts/check-reading-load';

describe('stanceAndAtomTypeFromFilename', () => {
  it('maps a base atom filename to its snake_case atom_type with no stance', () => {
    expect(stanceAndAtomTypeFromFilename('common-traps.md')).toEqual({ atom_type: 'common_traps', stance: undefined });
    expect(stanceAndAtomTypeFromFilename('hook.md')).toEqual({ atom_type: 'hook', stance: undefined });
  });

  it('strips a -shaken suffix and reports the shaken stance', () => {
    expect(stanceAndAtomTypeFromFilename('worked-example-shaken.md')).toEqual({
      atom_type: 'worked_example',
      stance: 'shaken',
    });
  });

  it('strips an -assured suffix and reports the assured stance', () => {
    expect(stanceAndAtomTypeFromFilename('intuition-assured.md')).toEqual({
      atom_type: 'intuition',
      stance: 'assured',
    });
  });

  it('handles a multi-word base atom type unchanged when it carries a stance suffix', () => {
    expect(stanceAndAtomTypeFromFilename('visual-analogy.md')).toEqual({
      atom_type: 'visual_analogy',
      stance: undefined,
    });
  });
});
