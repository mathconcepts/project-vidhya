/**
 * atom-loader — reads atoms/*.md, falls back to explainer.md, throws on missing.
 *
 * Uses real seeded concepts from modules/project-vidhya-content/concepts/.
 * The 3 seed concepts (calculus-derivatives, complex-numbers,
 * linear-algebra-eigenvalues) all have atoms/ folders post-Phase 1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadConceptAtoms, loadConceptMeta, reloadAtoms, ConceptNotFoundError } from '../atom-loader';

beforeEach(() => {
  reloadAtoms();
});

describe('loadConceptAtoms — fallback chain', () => {
  it('loads atoms when atoms/ folder exists', async () => {
    const atoms = await loadConceptAtoms('calculus-derivatives');
    expect(atoms.length).toBeGreaterThan(0);
    // We seeded at least: hook, intuition, formal_definition, worked_example, micro_exercise, common_traps
    const types = new Set(atoms.map((a) => a.atom_type));
    expect(types.has('hook')).toBe(true);
    expect(types.has('worked_example')).toBe(true);
    expect(types.has('common_traps')).toBe(true);
  });

  it('parses YAML frontmatter into typed fields', async () => {
    const atoms = await loadConceptAtoms('calculus-derivatives');
    const wp = atoms.find((a) => a.atom_type === 'worked_example');
    expect(wp).toBeDefined();
    expect(wp!.id).toContain('calculus-derivatives');
    expect(wp!.scaffold_fade).toBe(true);
    expect(typeof wp!.bloom_level).toBe('number');
    expect(typeof wp!.difficulty).toBe('number');
    expect(Array.isArray(wp!.exam_ids)).toBe(true);
  });

  it('common_traps atoms include tested_by_atom link', async () => {
    const atoms = await loadConceptAtoms('calculus-derivatives');
    const trap = atoms.find((a) => a.atom_type === 'common_traps');
    expect(trap).toBeDefined();
    expect(typeof trap!.tested_by_atom).toBe('string');
    expect(trap!.tested_by_atom).toContain('micro-exercise');
  });

  it('caches results — second call returns same array reference', async () => {
    const a1 = await loadConceptAtoms('calculus-derivatives');
    const a2 = await loadConceptAtoms('calculus-derivatives');
    expect(a1).toBe(a2);
  });

  it('reloadAtoms() invalidates cache', async () => {
    const a1 = await loadConceptAtoms('calculus-derivatives');
    reloadAtoms();
    const a2 = await loadConceptAtoms('calculus-derivatives');
    expect(a1).not.toBe(a2);
    expect(a2.length).toBe(a1.length);
  });

  it('throws ConceptNotFoundError for unknown concept', async () => {
    await expect(loadConceptAtoms('this-concept-does-not-exist')).rejects.toThrow(ConceptNotFoundError);
  });
});

describe('loadConceptMeta — additive schema', () => {
  it('loads existing v1 fields (title, exams, tags)', async () => {
    const meta = await loadConceptMeta('calculus-derivatives');
    expect(meta.concept_id).toBe('calculus-derivatives');
    expect(meta.title).toBe('Derivative');
    expect(Array.isArray(meta.exams)).toBe(true);
    expect(meta.exams!.length).toBeGreaterThan(0);
  });

  it('loads new v2 fields (learning_objectives, exam_overlays)', async () => {
    const meta = await loadConceptMeta('calculus-derivatives');
    expect(Array.isArray(meta.learning_objectives)).toBe(true);
    expect(meta.learning_objectives!.length).toBeGreaterThan(0);
    expect(typeof meta.learning_objectives![0].bloom_level).toBe('number');
    expect(meta.exam_overlays).toBeDefined();
  });

  it('returns defaults for unknown concept (no throw)', async () => {
    const meta = await loadConceptMeta('this-does-not-exist');
    expect(meta.concept_id).toBe('this-does-not-exist');
  });
});
