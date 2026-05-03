import { describe, it, expect } from 'vitest';
import {
  newTrialState,
  runUntilPauseOrDone,
  applyHumanAnswer,
  PAUSE_TIMEOUT_MS,
} from '../trial-runner';
import { loadPersona } from '../persona-loader';
import type { AtomShape } from '../policy-runner';

const PERSONA = loadPersona('priya-cbse-12-anxious');

const MCQ = (id: string): AtomShape => ({
  id,
  concept_id: 'limits-jee',
  atom_type: 'mcq',
  options: [
    { id: 'a', text: '0', is_correct: true },
    { id: 'b', text: '1', is_correct: false, distractor_kind: 'algebraic_trap' },
  ],
});

const INTERACTIVE = (id: string): AtomShape => ({
  id,
  concept_id: 'limits-jee',
  atom_type: 'manipulable',
  has_interactive_spec: true,
});

function freshState(atoms: AtomShape[]) {
  return newTrialState({
    run_id: 'test-run',
    persona_id: PERSONA.id,
    concept_id: 'limits-jee',
    user_id: '0aded0a0-0000-0000-0000-000000000000',
    session_id: 'sess',
    initial_mastery: 0.5,
    atoms,
  });
}

describe('runUntilPauseOrDone', () => {
  it('runs to completion when no atom needs a human', () => {
    const out = runUntilPauseOrDone(PERSONA, freshState([MCQ('a1'), MCQ('a2')]));
    expect(out.status).toBe('complete');
    expect(out.events.length).toBe(2);
    expect(out.remaining_atoms.length).toBe(0);
    expect(out.finalised_at).toBeTruthy();
  });

  it('pauses on the first interactive atom and writes pending', () => {
    const out = runUntilPauseOrDone(PERSONA, freshState([MCQ('a1'), INTERACTIVE('i1'), MCQ('a3')]));
    expect(out.status).toBe('paused');
    expect(out.pending).toBeTruthy();
    expect(out.pending!.atom.id).toBe('i1');
    expect(out.events.length).toBe(1); // only a1 processed
    expect(out.remaining_atoms.length).toBe(1); // a3 still queued
    expect(out.pending!.resume_token).toContain('i1');
  });

  it('resumes from pause, records the human answer, and finishes', () => {
    const paused = runUntilPauseOrDone(PERSONA, freshState([INTERACTIVE('i1'), MCQ('a2')]));
    expect(paused.status).toBe('paused');

    const resumed = applyHumanAnswer(paused, paused.pending!.resume_token, {
      answer: 'my answer',
      correct: true,
    });
    expect(resumed.status).toBe('running');
    expect(resumed.events.length).toBe(1);
    expect(resumed.events[0].result.kind).toBe('human_answered');

    const final = runUntilPauseOrDone(PERSONA, resumed);
    expect(final.status).toBe('complete');
    expect(final.events.length).toBe(2);
  });

  it('rejects a stale resume_token', () => {
    const paused = runUntilPauseOrDone(PERSONA, freshState([INTERACTIVE('i1')]));
    expect(() =>
      applyHumanAnswer(paused, 'wrong-token', { answer: 'x', correct: true }),
    ).toThrow(/resume_token/);
  });

  it('marks the trial timeout when paused_at is older than 24h', () => {
    const paused = runUntilPauseOrDone(PERSONA, freshState([INTERACTIVE('i1')]));
    const stalePaused = {
      ...paused,
      pending: {
        ...paused.pending!,
        paused_at: new Date(Date.now() - PAUSE_TIMEOUT_MS - 1000).toISOString(),
      },
    };
    const out = applyHumanAnswer(stalePaused, paused.pending!.resume_token, {
      answer: 'x',
      correct: true,
    });
    expect(out.status).toBe('timeout');
    expect(out.events.length).toBe(0); // no event recorded for the stale resume
  });

  it('is a no-op on already-complete state', () => {
    const done = runUntilPauseOrDone(PERSONA, freshState([MCQ('a1')]));
    expect(done.status).toBe('complete');
    const again = runUntilPauseOrDone(PERSONA, done);
    expect(again).toEqual(done);
  });
});
