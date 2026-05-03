import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { writeTrialReport, readTrial, listRunIds, digestOf } from '../trial-storage';
import { newTrialState, runUntilPauseOrDone } from '../trial-runner';
import { loadPersona } from '../persona-loader';
import type { AtomShape } from '../policy-runner';

const PERSONA = loadPersona('priya-cbse-12-anxious');
const MCQ: AtomShape = {
  id: 'limits-jee.mcq.x',
  concept_id: 'limits-jee',
  atom_type: 'mcq',
  options: [{ id: 'a', text: '0', is_correct: true }],
};
const INTERACTIVE: AtomShape = {
  id: 'limits-jee.interactive.x',
  concept_id: 'limits-jee',
  atom_type: 'manipulable',
  has_interactive_spec: true,
};

describe('trial-storage', () => {
  let tmp: string;
  let origRoot: string | undefined;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scenario-storage-'));
    origRoot = process.env.VIDHYA_SCENARIO_ROOT;
    process.env.VIDHYA_SCENARIO_ROOT = path.join(tmp, '.data', 'scenarios');
  });
  afterEach(() => {
    if (origRoot === undefined) delete process.env.VIDHYA_SCENARIO_ROOT;
    else process.env.VIDHYA_SCENARIO_ROOT = origRoot;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writes trial.json + digest.md and reads them back', () => {
    const state = runUntilPauseOrDone(
      PERSONA,
      newTrialState({
        run_id: 'r1',
        persona_id: PERSONA.id,
        concept_id: 'limits-jee',
        user_id: 'u',
        session_id: 's',
        initial_mastery: 0.5,
        atoms: [MCQ],
      }),
    );
    const dir = path.join(tmp, '.data', 'scenarios', 'r1');
    writeTrialReport(dir, state);
    expect(fs.existsSync(path.join(dir, 'trial.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'digest.md'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'pending.json'))).toBe(false);

    const back = readTrial(dir);
    expect(back.status).toBe('complete');
  });

  it('writes pending.json when paused, removes it when resumed', () => {
    const paused = runUntilPauseOrDone(
      PERSONA,
      newTrialState({
        run_id: 'r2',
        persona_id: PERSONA.id,
        concept_id: 'limits-jee',
        user_id: 'u',
        session_id: 's',
        initial_mastery: 0.5,
        atoms: [INTERACTIVE],
      }),
    );
    const dir = path.join(tmp, '.data', 'scenarios', 'r2');
    writeTrialReport(dir, paused);
    expect(fs.existsSync(path.join(dir, 'pending.json'))).toBe(true);

    // Simulate resume → status complete
    const completed = { ...paused, status: 'complete' as const, pending: undefined };
    writeTrialReport(dir, completed);
    expect(fs.existsSync(path.join(dir, 'pending.json'))).toBe(false);
  });

  it('listRunIds returns directory names sorted newest-first', () => {
    fs.mkdirSync(path.join(tmp, '.data', 'scenarios', 'aaa'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.data', 'scenarios', 'bbb'), { recursive: true });
    expect(listRunIds()).toEqual(['bbb', 'aaa']);
  });

  it('digestOf renders markdown table including pending row when paused', () => {
    const paused = runUntilPauseOrDone(
      PERSONA,
      newTrialState({
        run_id: 'r3',
        persona_id: PERSONA.id,
        concept_id: 'limits-jee',
        user_id: 'u',
        session_id: 's',
        initial_mastery: 0.5,
        atoms: [INTERACTIVE],
      }),
    );
    const md = digestOf(paused);
    expect(md).toContain('Status: **paused**');
    expect(md).toContain('⏸ paused');
  });
});
