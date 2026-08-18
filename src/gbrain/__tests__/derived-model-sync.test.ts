/**
 * Tests for src/gbrain/derived-model-sync.ts (T6 / D3).
 *
 * Two contracts locked:
 *   1. The bus listener is a SYNCHRONOUS entry point — an async failure
 *      inside it is caught by its own internal `.catch()` and logged,
 *      never escaping as an unhandled rejection (the bus itself only
 *      isolates synchronous throws).
 *   2. A real attempt refreshes the legacy model via the same
 *      `updateMastery` Bayesian update the legacy writers already use.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Attempt } from '../../core/interfaces';

const mockGetOrCreate = vi.fn();
const mockUpdateMastery = vi.fn();
const mockSaveStudentModel = vi.fn();

vi.mock('../student-model.js', () => ({
  getOrCreateStudentModel: (...args: unknown[]) => mockGetOrCreate(...args),
  updateMastery: (...args: unknown[]) => mockUpdateMastery(...args),
  saveStudentModel: (...args: unknown[]) => mockSaveStudentModel(...args),
}));

const ATTEMPT: Attempt = {
  studentId: 's1',
  objectId: 'o1',
  skillId: 'eigenvalues',
  correct: true,
  latencyMs: 4_000,
  ts: 999,
};

describe('derived-model-sync', () => {
  beforeEach(() => {
    mockGetOrCreate.mockReset();
    mockUpdateMastery.mockReset();
    mockSaveStudentModel.mockReset();
    process.env.DATABASE_URL = 'postgres://test/test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DB-less: no-op, never calls the legacy model', async () => {
    delete process.env.DATABASE_URL;
    const { onAttemptRecordedSyncEntry } = await import('../derived-model-sync');
    onAttemptRecordedSyncEntry(ATTEMPT);
    // The DB-less guard returns before any await, so the fire-and-forget
    // promise settles after a single microtask tick — flush that (not a
    // fixed-duration sleep) before asserting nothing fired.
    await Promise.resolve();
    expect(mockGetOrCreate).not.toHaveBeenCalled();
    process.env.DATABASE_URL = 'postgres://test/test';
  });

  it('is a synchronous function (returns undefined, not a Promise)', async () => {
    mockGetOrCreate.mockResolvedValue({ mastery_vector: {} });
    mockSaveStudentModel.mockResolvedValue(undefined);
    const { onAttemptRecordedSyncEntry } = await import('../derived-model-sync');
    const result = onAttemptRecordedSyncEntry(ATTEMPT);
    expect(result).toBeUndefined();
    await vi.waitFor(() => expect(mockSaveStudentModel).toHaveBeenCalled());
  });

  it('refreshes mastery_vector + prerequisite_alerts via getOrCreateStudentModel -> updateMastery -> saveStudentModel', async () => {
    const model = { mastery_vector: {}, prerequisite_alerts: [] };
    mockGetOrCreate.mockResolvedValue(model);
    mockUpdateMastery.mockReturnValue(model);
    mockSaveStudentModel.mockResolvedValue(undefined);

    const { onAttemptRecordedSyncEntry } = await import('../derived-model-sync');
    onAttemptRecordedSyncEntry(ATTEMPT);

    // Deterministic wait: poll until the fire-and-forget chain has reached
    // its final step, instead of sleeping a fixed duration that could race
    // under CI load.
    await vi.waitFor(() => expect(mockSaveStudentModel).toHaveBeenCalled());

    expect(mockGetOrCreate).toHaveBeenCalledWith(ATTEMPT.studentId);
    expect(mockUpdateMastery).toHaveBeenCalledWith(
      model,
      ATTEMPT.skillId,
      ATTEMPT.correct,
      expect.any(Number),
      ATTEMPT.latencyMs,
    );
    expect(mockSaveStudentModel).toHaveBeenCalledWith(model);
  });

  it('an async failure is caught internally, logged, and never becomes an unhandled rejection', async () => {
    mockGetOrCreate.mockRejectedValue(new Error('legacy store unreachable'));
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unhandled = vi.fn();
    process.once('unhandledRejection', unhandled);

    const { onAttemptRecordedSyncEntry } = await import('../derived-model-sync');
    // Calling it must not throw synchronously, and must not itself return
    // a rejected Promise the caller is expected to handle.
    expect(() => onAttemptRecordedSyncEntry(ATTEMPT)).not.toThrow();

    await vi.waitFor(() => expect(consoleErr).toHaveBeenCalled());

    expect(unhandled).not.toHaveBeenCalled();
    expect(consoleErr).toHaveBeenCalledWith(
      expect.stringContaining('[derived-model-sync] refresh failed'),
      expect.any(Error),
    );
    consoleErr.mockRestore();
  });

  it('registerDerivedModelSync is idempotent: a second call does not double-subscribe', async () => {
    const { registerDerivedModelSync, __resetDerivedModelSyncForTests } = await import('../derived-model-sync');
    const { __clearAttemptListeners, __attemptListenerCount, publishAttemptRecorded } =
      await import('../../events/attempts-bus');
    __resetDerivedModelSyncForTests();
    __clearAttemptListeners();

    mockGetOrCreate.mockResolvedValue({ mastery_vector: {} });
    mockUpdateMastery.mockReturnValue({ mastery_vector: {} });
    mockSaveStudentModel.mockResolvedValue(undefined);

    registerDerivedModelSync();
    registerDerivedModelSync();
    expect(__attemptListenerCount()).toBe(1);

    publishAttemptRecorded(ATTEMPT);
    await vi.waitFor(() => expect(mockSaveStudentModel).toHaveBeenCalled());
    expect(mockGetOrCreate).toHaveBeenCalledTimes(1); // not double-fired

    __clearAttemptListeners();
    __resetDerivedModelSyncForTests();
  });
});
