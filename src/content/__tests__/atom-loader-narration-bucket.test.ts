/**
 * applyMediaUrls × narration A/B integration tests (Phase F, §4.15).
 *
 * Verifies that when a narration experiment is running for an atom and the
 * student lands in the control bucket, audio_url is suppressed. Anonymous
 * users (no student_id) and atoms without a running narration experiment
 * always see the default (audio_url ships if the file exists).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

beforeEach(() => { mockQuery.mockReset(); });

describe('applyMediaUrls × narration A/B', () => {
  beforeEach(() => { process.env.DATABASE_URL = 'postgres://test'; });
  afterEach(() => { delete process.env.DATABASE_URL; });

  function setupAudioRowMock() {
    // First query: media_artifacts join — return one audio_narration row.
    mockQuery.mockResolvedValueOnce({
      rows: [{ atom_id: 'concept.intuition', kind: 'audio_narration' }],
    });
  }

  it('attaches audio_url for anonymous users (no student_id) regardless of bucket', async () => {
    setupAudioRowMock();
    vi.resetModules();
    const { applyMediaUrls } = await import('../atom-loader');
    const atoms = [{ id: 'concept.intuition', concept_id: 'concept', atom_type: 'intuition' } as any];
    const r = await applyMediaUrls(atoms, null);
    expect((r[0] as any).media?.audio_url).toBe('/api/lesson/media/concept.intuition/audio_narration');
  });

  it('attaches audio_url for student when no narration experiment is running', async () => {
    setupAudioRowMock();
    // Second query: getRunningExperiment for narration → no rows.
    mockQuery.mockResolvedValueOnce({ rows: [] });
    vi.resetModules();
    const { applyMediaUrls } = await import('../atom-loader');
    const atoms = [{ id: 'concept.intuition', concept_id: 'concept', atom_type: 'intuition' } as any];
    const r = await applyMediaUrls(atoms, 'student_42');
    expect((r[0] as any).media?.audio_url).toBe('/api/lesson/media/concept.intuition/audio_narration');
  });

  it('keeps audio_url on lookup failure (graceful degradation)', async () => {
    setupAudioRowMock();
    // Bucket query fails — should NOT crash and should NOT strip the URL.
    mockQuery.mockRejectedValueOnce(new Error('pg connect failed'));
    vi.resetModules();
    const { applyMediaUrls } = await import('../atom-loader');
    const atoms = [{ id: 'concept.intuition', concept_id: 'concept', atom_type: 'intuition' } as any];
    const r = await applyMediaUrls(atoms, 'student_42');
    expect((r[0] as any).media?.audio_url).toBe('/api/lesson/media/concept.intuition/audio_narration');
  });

  it('control bucket suppresses audio_url when narration experiment is running', async () => {
    setupAudioRowMock();
    // Second query: getRunningExperiment for narration returns an active exp.
    // The bucket assignment is FNV-1a deterministic on atom_id::student_id.
    // We pick a student_id that we know lands in 'control' bucket for this atom.
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'exp_1',
        atom_id: 'concept.intuition',
        control_version_n: 1,
        candidate_version_n: 1,
        variant_kind: 'narration',
        started_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'running',
        evaluated_at: null,
        verdict: null,
      }],
    });
    vi.resetModules();
    const { applyMediaUrls } = await import('../atom-loader');
    const { _internals } = await import('../concept-orchestrator/ab-tester');
    // Pick a student_id whose hash lands in control for the test atom.
    let controlStudent: string | null = null;
    for (let i = 0; i < 50; i++) {
      const sid = `student_${i}`;
      if (_internals.bucketFor('concept.intuition', sid) === 'control') {
        controlStudent = sid; break;
      }
    }
    expect(controlStudent).not.toBeNull();
    const atoms = [{ id: 'concept.intuition', concept_id: 'concept', atom_type: 'intuition' } as any];
    const r = await applyMediaUrls(atoms, controlStudent!);
    expect((r[0] as any).media?.audio_url).toBeUndefined();
  });
});
