/**
 * Unit tests for the knowledge tracks module.
 */

import { describe, it, expect } from 'vitest';
import {
  listTracks,
  getTrack,
  listTracksByBoard,
  getTracksForExam,
  KNOWLEDGE_TRACKS,
} from '../../../knowledge/tracks';

describe('knowledge/tracks', () => {
  describe('listTracks', () => {
    it('returns the master list', () => {
      const tracks = listTracks();
      expect(tracks.length).toBeGreaterThanOrEqual(KNOWLEDGE_TRACKS.length);
    });

    it('returns a copy — mutating it does not affect the registry', () => {
      const before = listTracks().length;
      const tracks = listTracks();
      tracks.push({} as any);
      expect(listTracks().length).toBe(before);
    });
  });

  describe('getTrack', () => {
    it('returns CBSE-12-MATH', () => {
      const t = getTrack('CBSE-12-MATH');
      expect(t).not.toBeNull();
      expect(t?.board).toBe('CBSE');
      expect(t?.grade).toBe('class-12');
      expect(t?.subject).toBe('mathematics');
      expect(t?.display_name).toBe('CBSE Class 12 Mathematics');
    });

    it('returns null for unknown id', () => {
      expect(getTrack('NOPE-99-ZZZ')).toBeNull();
    });

    it('every track has at least one suggested exam', () => {
      for (const t of listTracks()) {
        expect(t.suggested_exam_ids.length).toBeGreaterThan(0);
      }
    });

    it('all suggested exam_ids match the EXM- format', () => {
      for (const t of listTracks()) {
        for (const examId of t.suggested_exam_ids) {
          expect(examId).toMatch(/^EXM-/);
        }
      }
    });
  });

  describe('listTracksByBoard', () => {
    it('groups tracks by board → grade → subject', () => {
      const grouped = listTracksByBoard();
      expect(grouped.length).toBeGreaterThanOrEqual(3);
      const cbse = grouped.find(g => g.board === 'CBSE');
      expect(cbse).toBeDefined();
      expect(cbse!.grades.length).toBeGreaterThanOrEqual(2); // class 11 and 12
      const class12 = cbse!.grades.find(g => g.grade === 'class-12');
      expect(class12).toBeDefined();
      expect(class12!.subjects.length).toBeGreaterThanOrEqual(3);
    });

    it('every track appears exactly once in the grouped tree', () => {
      const grouped = listTracksByBoard();
      const flat = grouped.flatMap(b => b.grades.flatMap(g => g.subjects));
      const ids = flat.map(s => s.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
      expect(unique.size).toBe(listTracks().length);
    });
  });

  describe('getTracksForExam (inverse mapping)', () => {
    it('returns tracks for BITSAT', () => {
      const tracks = getTracksForExam('EXM-BITSAT-MATH-SAMPLE');
      expect(tracks.length).toBeGreaterThan(0);
      // BITSAT is a math entrance — it should pull tracks where subject === mathematics
      for (const t of tracks) {
        expect(t.subject).toBe('mathematics');
      }
    });

    it('returns empty list for unknown exam id', () => {
      expect(getTracksForExam('EXM-NONEXISTENT')).toEqual([]);
    });

    it('NEET Biology pulls only biology tracks', () => {
      const tracks = getTracksForExam('EXM-NEET-BIO-SAMPLE');
      expect(tracks.length).toBeGreaterThan(0);
      for (const t of tracks) {
        expect(t.subject).toBe('biology');
      }
    });
  });

  describe('id format consistency', () => {
    it('every track id matches BOARD-GRADE_NUM-SUBJECT_PREFIX format', () => {
      for (const t of listTracks()) {
        // e.g. "CBSE-12-MATH" or "KAR-PUE-12-BIOL"
        // Format: <BOARD>-<GRADE_NUM>-<SUBJECT_PREFIX_4>
        expect(t.id).toMatch(/^[A-Z][A-Z\-]+-1[12]-[A-Z]{4}$/);
      }
    });
  });
});
