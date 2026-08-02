/**
 * compose-signals — the client half of adaptive threading (items 6 + 7).
 *
 * Verifies:
 *   - mastery rolls up concept → topic via the concept graph
 *   - recent_errors are most-recent-first and capped at 10
 *   - material chunks come from the IndexedDB RAG search, mapped to the
 *     user_material_chunks shape the server expects, capped at 5
 *   - empty stores ⇒ empty signal object (generic-first ladder)
 *   - any store/embedder failure degrades to empty, never throws
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getStudentModel: vi.fn(),
  getErrors: vi.fn(),
  searchMaterials: vi.fn(),
  getChunk: vi.fn(),
  getMaterial: vi.fn(),
  getAllMaterials: vi.fn(),
  getConcept: vi.fn(),
  getAllConcepts: vi.fn(),
  embed: vi.fn(),
}));

vi.mock('./db', () => ({
  getStudentModel: mocks.getStudentModel,
  getErrors: mocks.getErrors,
  searchMaterials: mocks.searchMaterials,
  getChunk: mocks.getChunk,
  getMaterial: mocks.getMaterial,
  getAllMaterials: mocks.getAllMaterials,
}));

vi.mock('./concept-loader', () => ({
  getConcept: mocks.getConcept,
  getAllConcepts: mocks.getAllConcepts,
}));

vi.mock('./embedder', () => ({
  embed: mocks.embed,
}));

import { gatherComposeSignals } from './compose-signals';

beforeEach(() => {
  vi.clearAllMocks();
  // Neutral defaults: everything empty
  mocks.getStudentModel.mockResolvedValue(undefined);
  mocks.getErrors.mockResolvedValue([]);
  mocks.getAllMaterials.mockResolvedValue([]);
  mocks.getAllConcepts.mockResolvedValue([]);
  mocks.getConcept.mockResolvedValue(undefined);
});

describe('gatherComposeSignals — empty stores', () => {
  it('returns an empty signal object (generic path)', async () => {
    const signals = await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(signals).toEqual({});
  });
});

describe('gatherComposeSignals — mastery rollup', () => {
  it('maps concept mastery and averages it per topic', async () => {
    mocks.getStudentModel.mockResolvedValue({
      session_id: 'sess-1',
      mastery_vector: {
        'derivatives-basic': { score: 0.9, attempts: 5, correct: 4, last_update: 'x' },
        'chain-rule': { score: 0.7, attempts: 3, correct: 2, last_update: 'x' },
        'eigenvalues': { score: 0.4, attempts: 2, correct: 1, last_update: 'x' },
      },
    });
    mocks.getAllConcepts.mockResolvedValue([
      { id: 'derivatives-basic', topic: 'calculus' },
      { id: 'chain-rule', topic: 'calculus' },
      { id: 'eigenvalues', topic: 'linear-algebra' },
    ]);

    const signals = await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(signals.mastery_by_concept).toEqual({
      'derivatives-basic': 0.9,
      'chain-rule': 0.7,
      'eigenvalues': 0.4,
    });
    expect(signals.mastery_by_topic!['calculus']).toBeCloseTo(0.8);
    expect(signals.mastery_by_topic!['linear-algebra']).toBeCloseTo(0.4);
  });
});

describe('gatherComposeSignals — recent errors', () => {
  it('sends the last 10 errors, most-recent-first', async () => {
    const errors = Array.from({ length: 14 }, (_, i) => ({
      id: `err-${i}`,
      session_id: 'sess-1',
      concept_id: i % 2 === 0 ? 'derivatives-basic' : 'eigenvalues',
      topic: 'calculus',
      error_type: 'procedural',
      misconception_id: 'm',
      diagnosis: 'd',
      created_at: `2026-08-01T10:${String(i).padStart(2, '0')}:00Z`,
    }));
    mocks.getErrors.mockResolvedValue(errors);

    const signals = await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(signals.recent_errors).toHaveLength(10);
    // Most recent first
    expect(signals.recent_errors![0].created_at).toBe('2026-08-01T10:13:00Z');
    expect(signals.recent_errors![0]).toEqual({
      concept_id: 'eigenvalues',
      error_type: 'procedural',
      created_at: '2026-08-01T10:13:00Z',
    });
  });
});

describe('gatherComposeSignals — material chunks', () => {
  it('maps RAG hits to the user_material_chunks shape, filtering low similarity', async () => {
    mocks.getAllMaterials.mockResolvedValue([{ id: 'mat-1', filename: 'notes.pdf' }]);
    mocks.getConcept.mockResolvedValue({
      id: 'derivatives-basic',
      label: 'Basic Derivatives',
      description: 'Power rule',
      topic: 'calculus',
    });
    mocks.embed.mockResolvedValue(new Float32Array(384));
    mocks.searchMaterials.mockResolvedValue([
      { chunk_id: 'chk-1', score: 0.82 },
      { chunk_id: 'chk-2', score: 0.31 }, // below the 0.55 floor — dropped
    ]);
    mocks.getChunk.mockImplementation(async (id: string) =>
      id === 'chk-1'
        ? { id, material_id: 'mat-1', seq: 0, text: 'The derivative is the slope.' }
        : undefined,
    );
    mocks.getMaterial.mockResolvedValue({ id: 'mat-1', filename: 'notes.pdf' });

    const signals = await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(signals.user_material_chunks).toEqual([
      {
        material_id: 'mat-1',
        material_title: 'notes.pdf',
        chunk_text: 'The derivative is the slope.',
        similarity: 0.82,
      },
    ]);
  });

  it('skips the embedder entirely when the student has no materials', async () => {
    mocks.getAllMaterials.mockResolvedValue([]);
    await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it('degrades to no chunks when the embedder fails (never throws)', async () => {
    mocks.getAllMaterials.mockResolvedValue([{ id: 'mat-1', filename: 'notes.pdf' }]);
    mocks.embed.mockRejectedValue(new Error('model download failed'));
    const signals = await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(signals.user_material_chunks).toBeUndefined();
  });
});

describe('gatherComposeSignals — store failures', () => {
  it('degrades to empty signals when IndexedDB reads throw', async () => {
    mocks.getStudentModel.mockRejectedValue(new Error('idb unavailable'));
    mocks.getErrors.mockRejectedValue(new Error('idb unavailable'));
    mocks.getAllMaterials.mockRejectedValue(new Error('idb unavailable'));
    const signals = await gatherComposeSignals('sess-1', 'derivatives-basic');
    expect(signals).toEqual({});
  });
});
