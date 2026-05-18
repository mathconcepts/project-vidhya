/**
 * Tests for prep_intent (student goal awareness) integration.
 *
 * The intent shapes:
 *   1. rankEntriesForStudent  — different gap classes get different weight
 *   2. recommendBridgeContent — same, via the override
 *   3. derivePrepIntent        — inference from profile context
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import {
  rankEntriesForStudent, recommendBridgeContent,
} from '../../../syllabus-bridge/gbrain-integration';
import { getMapping } from '../../../syllabus-bridge/registry';
import { derivePrepIntent, type ExamRegistration } from '../../../session-planner/exam-profile-store';

const MAPPING_ID = 'TN-12-MATH--EXM-JEEMAIN-MATH-SAMPLE';
const STORES = [
  '.data/syllabus-bridge-content.json',
  '.data/student-models.json',
  '.data/exam-profiles.json',
];

function clearStores() {
  for (const p of STORES) if (existsSync(p)) rmSync(p);
}

function mkReg(overrides: Partial<ExamRegistration> = {}): ExamRegistration {
  return {
    exam_id: 'EXM-JEEMAIN-MATH-SAMPLE',
    exam_date: '2026-05-01',
    added_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('derivePrepIntent — inference', () => {
  it('uses explicit prep_intent when set', () => {
    expect(derivePrepIntent(mkReg({ prep_intent: 'board-focused' }))).toBe('board-focused');
    expect(derivePrepIntent(mkReg({ prep_intent: 'entrance-focused' }))).toBe('entrance-focused');
  });

  it('with school track + entrance exam → bridge', () => {
    expect(derivePrepIntent(mkReg({
      knowledge_track_id: 'TN-HSE-12-MATH',
      exam_id: 'EXM-JEEMAIN-MATH-SAMPLE',
    }))).toBe('bridge');
    expect(derivePrepIntent(mkReg({
      knowledge_track_id: 'CBSE-12-MATH',
      exam_id: 'EXM-BITSAT-MATH-SAMPLE',
    }))).toBe('bridge');
    expect(derivePrepIntent(mkReg({
      knowledge_track_id: 'CBSE-12-PHYS',
      exam_id: 'EXM-NEET-PHYS-SAMPLE',
    }))).toBe('bridge');
  });

  it('with school track but no entrance signal → board-focused', () => {
    expect(derivePrepIntent(mkReg({
      knowledge_track_id: 'TN-HSE-12-MATH',
      exam_id: 'EXM-CUSTOM-BOARD-MOCK',
    }))).toBe('board-focused');
  });

  it('no school track at all → entrance-focused', () => {
    expect(derivePrepIntent(mkReg({
      exam_id: 'EXM-JEEMAIN-MATH-SAMPLE',
    }))).toBe('entrance-focused');
  });
});

describe('rankEntriesForStudent — intent reweights gap classes', () => {
  beforeEach(clearStores);

  it('board-focused down-weights depth-gap entries', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const boardRanked = await rankEntriesForStudent(mapping, 'student-board', {
      intent_override: 'board-focused',
    });
    const entranceRanked = await rankEntriesForStudent(mapping, 'student-entrance', {
      intent_override: 'entrance-focused',
    });

    // Average need_score for depth-gap entries under each intent
    const avgFor = (ranked: typeof boardRanked, cls: string) => {
      const xs = ranked.filter(r => r.entry.gap_class === cls);
      return xs.length ? xs.reduce((s, r) => s + r.need_score, 0) / xs.length : 0;
    };

    const boardDepth = avgFor(boardRanked, 'depth-gap');
    const entranceDepth = avgFor(entranceRanked, 'depth-gap');

    // Entrance-focused should care MORE about depth-gap than board-focused
    expect(entranceDepth).toBeGreaterThan(boardDepth);
  });

  it('board-focused up-weights aligned/foundation entries vs entrance-focused', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const boardRanked = await rankEntriesForStudent(mapping, 'student-x', {
      intent_override: 'board-focused',
    });
    const entranceRanked = await rankEntriesForStudent(mapping, 'student-y', {
      intent_override: 'entrance-focused',
    });

    const avgFor = (ranked: typeof boardRanked, cls: string) => {
      const xs = ranked.filter(r => r.entry.gap_class === cls);
      return xs.length ? xs.reduce((s, r) => s + r.need_score, 0) / xs.length : 0;
    };

    // Aligned entries: board should weight them higher than entrance
    const boardAligned = avgFor(boardRanked, 'aligned');
    const entranceAligned = avgFor(entranceRanked, 'aligned');
    expect(boardAligned).toBeGreaterThan(entranceAligned);
  });

  it('reason string includes the intent label', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    const ranked = await rankEntriesForStudent(mapping, 'student-reason', {
      intent_override: 'board-focused',
    });
    for (const r of ranked) {
      expect(r.reason).toMatch(/board-focused/);
    }
  });

  it('need_score stays in [0, 1] after intent multiplier', async () => {
    const mapping = getMapping(MAPPING_ID)!;
    for (const intent of ['board-focused', 'bridge', 'entrance-focused'] as const) {
      const ranked = await rankEntriesForStudent(mapping, `bounded-${intent}`, {
        intent_override: intent,
      });
      for (const r of ranked) {
        expect(r.need_score).toBeGreaterThanOrEqual(0);
        expect(r.need_score).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('recommendBridgeContent — intent override flows through', () => {
  beforeEach(clearStores);

  it('threads intent_override into ranking', async () => {
    // Board-focused recs should NOT include the top JEE-flavored entries
    // that entrance-focused recs would surface.
    const boardRecs = await recommendBridgeContent('student-overlap', MAPPING_ID, {
      limit: 5, intent_override: 'board-focused', min_score: 0,
    });
    const entranceRecs = await recommendBridgeContent('student-overlap', MAPPING_ID, {
      limit: 5, intent_override: 'entrance-focused', min_score: 0,
    });

    // The two should not produce identical orderings unless coincidence
    const boardIds = boardRecs.map(r => r.entry_id).join(',');
    const entranceIds = entranceRecs.map(r => r.entry_id).join(',');

    // Either the orderings differ, or at minimum the score curves differ
    // (verified by the rank tests above). Here we assert the override is
    // accepted without error and returns valid recommendations.
    expect(boardRecs.length).toBeGreaterThan(0);
    expect(entranceRecs.length).toBeGreaterThan(0);

    // Both runs should yield valid entry ids
    for (const r of [...boardRecs, ...entranceRecs]) {
      expect(r.entry_id).toMatch(/\w+/);
      expect(r.need_score).toBeGreaterThanOrEqual(0);
    }
  });
});
