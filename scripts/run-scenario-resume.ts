#!/usr/bin/env -S npx tsx
/**
 * scripts/run-scenario-resume.ts
 *
 * Resume a paused scenario by prompting stdin for the human's answer to
 * the atom that triggered the pause, then continuing the trial until
 * completion or the next pause.
 *
 *   npm run demo:scenario:resume <run-id>
 */

import path from 'path';
import readline from 'readline';
import { loadPersona } from '../src/scenarios/persona-loader';
import {
  applyHumanAnswer,
  runUntilPauseOrDone,
  PAUSE_TIMEOUT_MS,
} from '../src/scenarios/trial-runner';
import { readTrial, runDir, writeTrialReport } from '../src/scenarios/trial-storage';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  const runId = process.argv[2];
  if (!runId) {
    console.error('Usage: run-scenario-resume <run-id>');
    process.exit(1);
  }

  const dir = runDir(runId);
  const state = readTrial(dir);

  if (state.status === 'complete') {
    console.log(`[scenario] run ${runId} already complete. Nothing to resume.`);
    return;
  }
  if (state.status === 'timeout') {
    console.log(`[scenario] run ${runId} timed out earlier. Re-run from scratch.`);
    return;
  }
  if (state.status !== 'paused' || !state.pending) {
    console.error(`[scenario] run ${runId} is not paused (status=${state.status})`);
    process.exit(2);
  }

  // 24h timeout check up-front — clearer UX than forwarding into runner.
  const pausedAt = Date.parse(state.pending.paused_at);
  if (Number.isFinite(pausedAt) && Date.now() - pausedAt > PAUSE_TIMEOUT_MS) {
    const finalised = { ...state, status: 'timeout' as const, finalised_at: new Date().toISOString() };
    writeTrialReport(dir, finalised);
    console.log(`[scenario] run ${runId} paused > 24h ago — marked timeout. Re-run from scratch.`);
    return;
  }

  console.log(`[scenario] resuming ${runId}`);
  console.log(`[scenario] paused on atom: ${state.pending.atom.id}`);
  console.log(`[scenario] reason: ${state.pending.reason}`);

  const answer = await ask('Your answer for this atom (free text): ');
  const correctRaw = await ask('Mark as correct? [y/N]: ');
  const correct = /^y(es)?$/i.test(correctRaw);

  const persona = loadPersona(state.persona_id);
  const resumed = applyHumanAnswer(state, state.pending.resume_token, { answer, correct });

  // applyHumanAnswer might already finalise as 'timeout' if the timeout was
  // checked there; in either case run the loop to completion.
  const next = runUntilPauseOrDone(persona, resumed);
  writeTrialReport(dir, next);

  if (next.status === 'paused' && next.pending) {
    console.log('');
    console.log(`[SCENARIO PAUSED] Next atom needs human input:`);
    console.log(`  ${next.pending.reason}`);
    console.log(`  resume:  npm run demo:scenario:resume ${path.basename(dir)}`);
  } else if (next.status === 'timeout') {
    console.log(`[scenario] run ${runId} timed out. Re-run from scratch.`);
  } else {
    console.log(`[scenario] done. mastery ${next.initial_mastery.toFixed(2)} → ${next.current_mastery.toFixed(2)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
