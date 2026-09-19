import { describe, it, expect } from 'vitest';
import {
  validateBridge,
  loadAllBridges,
  auditBridges,
  bridgeFor,
  bridgeForTrack,
  MAX_BRIDGE_CHARS,
  BRIDGE_COVERAGES,
} from '../curriculum-bridge';
import { conceptsDeclaredByExam } from '../../constants/concept-graph';
import { KNOWLEDGE_TRACKS } from '../../knowledge/tracks';

const ok = {
  coverage: 'aligned' as const,
  confidence: 'confirmed' as const,
  board_source: 'Class 11 Ch. 9, Differential Calculus',
  bridge: 'You already did a full chapter on this in Class 11.',
};

describe('validateBridge', () => {
  it('accepts a well-formed entry', () => {
    expect(validateBridge(ok)).toEqual([]);
  });

  it('refuses a coverage value outside the closed set', () => {
    expect(validateBridge({ ...ok, coverage: 'mostly' })).toEqual([
      expect.stringContaining('coverage must be one of'),
    ]);
  });

  it('refuses an unknown confidence value', () => {
    expect(validateBridge({ ...ok, confidence: 'pretty sure' })).toEqual([
      expect.stringContaining('confidence must be one of'),
    ]);
  });

  it('refuses a coverage claim with no board source behind it', () => {
    expect(validateBridge({ ...ok, board_source: '  ' })).toEqual([
      expect.stringContaining('board_source is required'),
    ]);
  });

  it('refuses an over-long bridge line, reporting the real length', () => {
    const long = 'a'.repeat(MAX_BRIDGE_CHARS + 1);
    expect(validateBridge({ ...ok, bridge: long })).toEqual([
      `${MAX_BRIDGE_CHARS + 1} characters, cap is ${MAX_BRIDGE_CHARS}`,
    ]);
  });

  it('accepts a line exactly at the cap', () => {
    expect(validateBridge({ ...ok, bridge: 'a'.repeat(MAX_BRIDGE_CHARS) })).toEqual([]);
  });

  it('refuses mathematical notation', () => {
    expect(validateBridge({ ...ok, bridge: 'The board covers $x^2$ already.' })).toEqual([
      expect.stringContaining('no mathematical notation'),
    ]);
  });

  it('refuses alarm framing — a gap is information, not a warning', () => {
    for (const word of ['behind', 'weak', 'disadvantage', 'panic']) {
      const problems = validateBridge({ ...ok, bridge: `Your board leaves you ${word} here.` });
      expect(problems.some((p) => p.includes('alarm framing'))).toBe(true);
    }
  });

  it('does not mistake ordinary words for alarm framing', () => {
    expect(validateBridge({ ...ok, bridge: 'The Cartesian form is new here, so budget time for it.' })).toEqual([]);
  });

  it('reports every problem at once, not just the first', () => {
    expect(validateBridge({ coverage: 'nope', confidence: 'nope', board_source: '', bridge: '' }).length)
      .toBeGreaterThan(3);
  });
});

describe('the committed bridge files', () => {
  it('audit clean', () => {
    expect(auditBridges(loadAllBridges(true))).toEqual([]);
  });

  it('every file names a registered knowledge track', () => {
    const ids = new Set(KNOWLEDGE_TRACKS.map((t) => t.id));
    for (const f of loadAllBridges(true)) expect(ids.has(f.track_id)).toBe(true);
  });

  it('TN-HSE-12-MATH covers every concept jee-main declares', () => {
    const file = bridgeForTrack('TN-HSE-12-MATH');
    expect(file).not.toBeNull();
    const declared = conceptsDeclaredByExam('jee-main').map((c) => c.id).sort();
    expect(Object.keys(file!.concepts).sort()).toEqual(declared);
  });

  it('marks the three documented gaps as not simply aligned', () => {
    // Research finding: TN teaches 3D in vector form only, gives conics one
    // Class 12 chapter where NCERT gives two years, and teaches dispersion in
    // Class 10 and never returns. None of the three may read as `aligned`.
    for (const id of ['three-d-geometry', 'parabola-ellipse-hyperbola', 'statistics-jee']) {
      const entry = bridgeFor('TN-HSE-12-MATH', id);
      expect(entry, id).not.toBeNull();
      expect(entry!.coverage, id).not.toBe('aligned');
    }
  });

  it('marks calculus as aligned — TN teaches it well and the content must not patronise', () => {
    for (const id of ['limits-jee', 'indefinite-integration', 'differential-equations-jee']) {
      expect(bridgeFor('TN-HSE-12-MATH', id)!.coverage, id).toBe('aligned');
    }
  });

  it('uses only closed-set coverage values', () => {
    for (const f of loadAllBridges(true)) {
      for (const e of Object.values(f.concepts)) {
        expect(BRIDGE_COVERAGES).toContain(e.coverage);
      }
    }
  });
});

describe('bridgeFor', () => {
  it('returns null for a track with no authored bridge, rather than guessing', () => {
    expect(bridgeFor('CBSE-12-MATH', 'three-d-geometry')).toBeNull();
  });

  it('returns null for a null or empty track id', () => {
    expect(bridgeFor(null, 'three-d-geometry')).toBeNull();
    expect(bridgeFor(undefined, 'three-d-geometry')).toBeNull();
    expect(bridgeFor('', 'three-d-geometry')).toBeNull();
  });

  it('returns null for a concept outside the bridged exam', () => {
    expect(bridgeFor('TN-HSE-12-MATH', 'eigenvalues')).toBeNull();
  });
});
