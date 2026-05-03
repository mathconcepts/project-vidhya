/**
 * src/scenarios/trial-runner.ts
 *
 * The deterministic loop that drives a persona through atoms and either
 * runs to completion or pauses on the first atom that needs a human.
 *
 * Pause + resume contract:
 *   - State is fully serialised as JSON. The runner never holds in-memory
 *     state between calls.
 *   - pending.json (when present) records the atom that triggered the
 *     pause + a resume_token. The token must match on resume to prevent
 *     stale-resume races.
 *   - 24h timeout: if `Date.now() - paused_at > 24h`, the resume function
 *     marks the trial 'timeout' and finalises rather than continuing.
 *     Re-runs are one command — there's no partial-resume.
 */

import type { Persona } from './persona-loader';
import { applyPolicy, type AtomShape } from './policy-runner';

export const PAUSE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export type TrialStatus = 'running' | 'paused' | 'complete' | 'timeout';

export interface TrialEvent {
  idx: number;
  atom_id: string;
  atom_type: string;
  result:
    | { kind: 'answer'; answer_id: string; correct: boolean; via_rule: string }
    | { kind: 'needs_human'; reason: string }
    | { kind: 'human_answered'; answer: string; correct: boolean };
  mastery_after: number;
}

export interface PendingState {
  atom_idx: number;
  atom: AtomShape;
  reason: string;
  resume_token: string;
  paused_at: string; // ISO
}

export interface TrialState {
  schema_version: 1;
  run_id: string;
  persona_id: string;
  concept_id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  status: TrialStatus;
  initial_mastery: number;
  current_mastery: number;
  events: TrialEvent[];
  /** Atoms NOT yet processed (head is next). */
  remaining_atoms: AtomShape[];
  pending?: PendingState;
  finalised_at?: string;
}

/** Step a paused state forward by recording the human's answer. */
export function applyHumanAnswer(
  state: TrialState,
  resume_token: string,
  human_answer: { answer: string; correct: boolean },
): TrialState {
  if (state.status !== 'paused' || !state.pending) {
    throw new Error(`trial-runner: not paused (status=${state.status})`);
  }
  if (state.pending.resume_token !== resume_token) {
    throw new Error('trial-runner: resume_token mismatch (stale or wrong run)');
  }
  const pausedAt = Date.parse(state.pending.paused_at);
  if (Number.isFinite(pausedAt) && Date.now() - pausedAt > PAUSE_TIMEOUT_MS) {
    return finalise({ ...state, status: 'timeout' });
  }

  const delta = human_answer.correct ? +0.05 : -0.02;
  const mastery_after = clamp01(state.current_mastery + delta);
  const event: TrialEvent = {
    idx: state.pending.atom_idx,
    atom_id: state.pending.atom.id,
    atom_type: state.pending.atom.atom_type,
    result: { kind: 'human_answered', answer: human_answer.answer, correct: human_answer.correct },
    mastery_after,
  };

  return {
    ...state,
    status: 'running',
    current_mastery: mastery_after,
    events: [...state.events, event],
    pending: undefined,
  };
}

/**
 * Drive the persona through `state.remaining_atoms` until completion or
 * the next pause. Returns the new state — either status='complete' (with
 * finalised_at) or status='paused' (with pending populated).
 */
export function runUntilPauseOrDone(persona: Persona, state: TrialState): TrialState {
  if (state.status === 'complete' || state.status === 'timeout') return state;

  let s: TrialState = { ...state, status: 'running' };
  while (s.remaining_atoms.length > 0) {
    const [atom, ...rest] = s.remaining_atoms;
    const idx = s.events.length;
    const result = applyPolicy({
      persona,
      atom,
      atom_idx: idx,
      mastery: s.current_mastery,
      first_exposure: idx === 0,
    });

    if (result.kind === 'needs_human') {
      // Pause. Don't shift the atom off remaining yet — resume's job is
      // to fold it into events.
      const resume_token = `${s.run_id}::${idx}::${atom.id}`;
      return {
        ...s,
        status: 'paused',
        pending: {
          atom_idx: idx,
          atom,
          reason: result.reason,
          resume_token,
          paused_at: new Date().toISOString(),
        },
        remaining_atoms: rest, // atom moves out of remaining; pending is the source of truth
      };
    }

    const delta = result.correct ? +0.05 : -0.02;
    const mastery_after = clamp01(s.current_mastery + delta);
    s = {
      ...s,
      current_mastery: mastery_after,
      events: [
        ...s.events,
        {
          idx,
          atom_id: atom.id,
          atom_type: atom.atom_type,
          result,
          mastery_after,
        },
      ],
      remaining_atoms: rest,
    };
  }

  return finalise({ ...s, status: 'complete' });
}

function finalise(s: TrialState): TrialState {
  return { ...s, finalised_at: new Date().toISOString() };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Build the initial trial state. Caller seeds remaining_atoms and the
 * persona's initial mastery for the concept.
 */
export function newTrialState(input: {
  run_id: string;
  persona_id: string;
  concept_id: string;
  user_id: string;
  session_id: string;
  initial_mastery: number;
  atoms: AtomShape[];
}): TrialState {
  return {
    schema_version: 1,
    run_id: input.run_id,
    persona_id: input.persona_id,
    concept_id: input.concept_id,
    user_id: input.user_id,
    session_id: input.session_id,
    started_at: new Date().toISOString(),
    status: 'running',
    initial_mastery: input.initial_mastery,
    current_mastery: input.initial_mastery,
    events: [],
    remaining_atoms: input.atoms,
  };
}
