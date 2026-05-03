/**
 * src/scenarios/trial-storage.ts
 *
 * Disk layout for scenario runs:
 *
 *   .data/scenarios/<run-id>/
 *     trial.json     — full state (source of truth)
 *     pending.json   — present iff status === 'paused'
 *     digest.md      — markdown view, regenerated from trial.json
 *
 * Files-on-disk-as-DB pattern (matches flatFileStore). Admin UI lists by
 * directory, reads JSON, never writes from the web side.
 */

import fs from 'fs';
import path from 'path';
import type { TrialState } from './trial-runner';

export function scenarioRoot(): string {
  if (process.env.VIDHYA_SCENARIO_ROOT) return process.env.VIDHYA_SCENARIO_ROOT;
  return path.join(process.cwd(), '.data', 'scenarios');
}

export function runDir(run_id: string): string {
  return path.join(scenarioRoot(), run_id);
}

export function writeTrialReport(dir: string, state: TrialState): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'trial.json'), JSON.stringify(state, null, 2));

  if (state.status === 'paused' && state.pending) {
    fs.writeFileSync(path.join(dir, 'pending.json'), JSON.stringify(state.pending, null, 2));
  } else {
    const pendingPath = path.join(dir, 'pending.json');
    if (fs.existsSync(pendingPath)) fs.unlinkSync(pendingPath);
  }

  fs.writeFileSync(path.join(dir, 'digest.md'), digestOf(state));
}

export function readTrial(dir: string): TrialState {
  const file = path.join(dir, 'trial.json');
  if (!fs.existsSync(file)) {
    throw new Error(`scenario run not found: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as TrialState;
}

export function listRunIds(): string[] {
  const root = scenarioRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse(); // newest first
}

export function digestOf(state: TrialState): string {
  const lines: string[] = [
    `# Scenario: ${state.persona_id} on ${state.concept_id}`,
    `Run id: \`${state.run_id}\``,
    `Status: **${state.status}**`,
    `Mastery: ${state.initial_mastery.toFixed(2)} → ${state.current_mastery.toFixed(2)} ` +
      `(Δ ${state.current_mastery - state.initial_mastery >= 0 ? '+' : ''}${(state.current_mastery - state.initial_mastery).toFixed(2)})`,
    '',
    '| # | atom | result | rule / reason | mastery |',
    '|---|------|--------|---------------|---------|',
  ];
  for (const e of state.events) {
    let mark = '·';
    let rule = '';
    if (e.result.kind === 'answer') {
      mark = e.result.correct ? '✓' : '✗';
      rule = e.result.via_rule;
    } else if (e.result.kind === 'human_answered') {
      mark = e.result.correct ? '✓ (human)' : '✗ (human)';
      rule = `human: ${e.result.answer}`;
    } else {
      mark = '⏸';
      rule = e.result.reason;
    }
    lines.push(`| ${e.idx} | \`${e.atom_id}\` | ${mark} | ${rule} | ${e.mastery_after.toFixed(2)} |`);
  }
  if (state.pending) {
    lines.push(`| ${state.pending.atom_idx} | \`${state.pending.atom.id}\` | ⏸ paused | ${state.pending.reason} | — |`);
  }
  return lines.join('\n');
}
