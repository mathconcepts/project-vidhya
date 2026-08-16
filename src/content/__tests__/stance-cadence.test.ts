/**
 * The cadence and the gate must agree.
 *
 * An instruction a model may or may not follow is a hope. These tests exist so
 * that every rule the cadence states has a corresponding check that fails the
 * build, and so that the two cannot drift apart — which is the failure mode
 * this repo has already paid for twice, with model ids and with the motivation
 * vocabulary.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  SHAKEN_CADENCE,
  ASSURED_CADENCE,
  CADENCE_ATOM_TYPES,
  buildStanceInstruction,
  cadenceFor,
} from '../stance-cadence';
import { NARRATIVE_ATOM_TYPES } from '../stance-variants';
import { ASSURED_PROSE_BUDGET } from '../../../scripts/check-variant-agreement';

describe('the cadence states what the gate enforces', () => {
  it('tells the writer to go shorter, which is what the gate checks', () => {
    expect(SHAKEN_CADENCE.toLowerCase()).toContain('shorter than the base');
  });

  it('names the walkthrough as the home for displaced scaffolding', () => {
    expect(SHAKEN_CADENCE).toContain('guided_walkthrough');
  });

  it('permits adding a walkthrough but not other interactives', () => {
    // Matches the creation rule in compareBlocks(): shaken may add a
    // guided_walkthrough; manipulable and simulation may never be invented.
    expect(SHAKEN_CADENCE).toMatch(/you may not add any other kind of interactive/i);
  });

  it('tells both stances to vary the opening move', () => {
    expect(SHAKEN_CADENCE.toLowerCase()).toContain('vary the opening move');
    expect(ASSURED_CADENCE.toLowerCase()).toContain('vary the opening move');
  });

  it('forbids reassurance in the shaken cadence', () => {
    expect(SHAKEN_CADENCE.toLowerCase()).toContain('no praise');
    expect(SHAKEN_CADENCE.toLowerCase()).toContain('no reassurance');
  });

  it('does not tell the assured stance to add scaffolding', () => {
    expect(ASSURED_CADENCE.toLowerCase()).toContain('do not add scaffolding');
  });
});

describe('cadence atom types match the read path', () => {
  it('is the same set the loader applies variants to', () => {
    // If these diverge, the generator writes variants for an atom type that
    // applyStanceVariants ignores, or vice versa.
    expect([...CADENCE_ATOM_TYPES].sort()).toEqual([...NARRATIVE_ATOM_TYPES].sort());
  });

  it('excludes formal_definition', () => {
    expect(CADENCE_ATOM_TYPES).not.toContain('formal_definition' as never);
  });
});

describe('buildStanceInstruction', () => {
  it('states the shaken budget as a number, not as "be concise"', () => {
    const out = buildStanceInstruction({
      stance: 'shaken',
      atomType: 'intuition',
      baseProseWords: 68,
    });
    expect(out).toContain('at most 68 prose words');
  });

  it('states the assured ceiling from the gate constant, not a copy', () => {
    for (const atomType of CADENCE_ATOM_TYPES) {
      const out = buildStanceInstruction({ stance: 'assured', atomType });
      expect(out).toContain(`at most ${ASSURED_PROSE_BUDGET[atomType]} prose words`);
    }
  });

  it('folds in the topic voice when there is one', () => {
    const out = buildStanceInstruction({
      stance: 'shaken',
      atomType: 'hook',
      topicGuidance: 'Lead with what the matrix DOES geometrically.',
    });
    expect(out).toContain('what the matrix DOES geometrically');
    expect(out).toContain(cadenceFor('shaken').split('\n')[0]);
  });

  it('works without a topic voice or a base count', () => {
    expect(() =>
      buildStanceInstruction({ stance: 'shaken', atomType: 'hook' }),
    ).not.toThrow();
  });
});

describe('the pilot topic carries a cadence', () => {
  const tpl = path.join(
    process.cwd(),
    'modules/project-vidhya-content/templates/linear-algebra.yaml',
  );

  it('declares stances for every narrative atom type and no others', () => {
    const raw = fs.readFileSync(tpl, 'utf-8');
    // Deliberately a structural read rather than a YAML parse: this asserts
    // the shape an operator sees when they open the file.
    for (const t of CADENCE_ATOM_TYPES) {
      const section = raw.split(new RegExp(`^${t}:$`, 'm'))[1]?.split(/^\S/m)[0] ?? '';
      expect(section, `${t} should declare stances`).toContain('stances:');
      expect(section).toContain('shaken:');
      expect(section).toContain('assured:');
    }
    const defn = raw.split(/^formal_definition:$/m)[1]?.split(/^\S/m)[0] ?? '';
    expect(defn, 'a definition has no gentler form').not.toContain('stances:');
  });
});
