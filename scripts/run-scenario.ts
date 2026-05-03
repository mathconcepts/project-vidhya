#!/usr/bin/env -S npx tsx
/**
 * scripts/run-scenario.ts
 *
 * Drives a SCRIPTED PERSONA through N atoms. On the first interactive
 * atom (or any atom the policy can't auto-answer), pauses the trial,
 * writes pending.json, and prints a banner pointing at the resume CLI.
 *
 *   npm run demo:scenario <persona-id> <concept-id> [--atoms 5] [--out PATH]
 *   npm run demo:scenario:resume <run-id>
 */

import fs from 'fs';
import path from 'path';
import { loadPersona, listPersonaIds } from '../src/scenarios/persona-loader';
import type { AtomShape } from '../src/scenarios/policy-runner';
import { seedPersona } from '../src/scenarios/persona-seeder';
import { newTrialState, runUntilPauseOrDone, type TrialState } from '../src/scenarios/trial-runner';
import { writeTrialReport, scenarioRoot } from '../src/scenarios/trial-storage';

interface Args {
  persona_id: string;
  concept_id: string;
  atoms: number;
  out_dir: string;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let atoms = 5;
  let outDir = '';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--atoms') atoms = Number(argv[++i] ?? 5);
    else if (a === '--out') outDir = argv[++i] ?? '';
    else if (!a.startsWith('--')) positional.push(a);
  }
  if (positional.length < 2) {
    const ids = listPersonaIds().join(', ') || '(none yet)';
    console.error('Usage: run-scenario <persona-id> <concept-id> [--atoms N] [--out DIR]');
    console.error(`Available personas: ${ids}`);
    process.exit(1);
  }
  const [persona_id, concept_id] = positional;
  const runId = `${persona_id}--${concept_id}--${new Date().toISOString().replace(/[:.]/g, '-')}`;
  return {
    persona_id,
    concept_id,
    atoms,
    out_dir: outDir || path.join(scenarioRoot(), runId),
  };
}

async function loadConceptAtoms(concept_id: string): Promise<AtomShape[]> {
  const { loadConceptAtoms: load } = await import('../src/content/atom-loader');
  const atoms = await load(concept_id);
  return atoms.map((a: any) => ({
    id: a.id,
    concept_id: a.concept_id ?? concept_id,
    atom_type: a.atom_type ?? 'unknown',
    options: Array.isArray(a.options) ? a.options : undefined,
    has_interactive_spec:
      typeof a.body === 'string' && /```interactive-spec/.test(a.body),
  }));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const persona = loadPersona(args.persona_id);

  console.log(`[scenario] persona=${persona.id} concept=${args.concept_id} atoms=${args.atoms}`);
  console.log(`[scenario] out=${args.out_dir}`);

  let seeded;
  try {
    seeded = await seedPersona(persona);
    console.log(`[scenario] seeded user_id=${seeded.user_id}`);
  } catch (err) {
    console.error(`[scenario] FATAL: seeding failed: ${(err as Error).message}`);
    process.exit(2);
  }

  const allAtoms = await loadConceptAtoms(args.concept_id);
  if (allAtoms.length === 0) {
    console.error(`[scenario] no atoms found for concept ${args.concept_id}`);
    process.exit(3);
  }
  const atoms = allAtoms.slice(0, args.atoms);

  const initial = persona.seed.initial_mastery[args.concept_id] ?? 0.3;
  const state = newTrialState({
    run_id: path.basename(args.out_dir),
    persona_id: persona.id,
    concept_id: args.concept_id,
    user_id: seeded.user_id,
    session_id: seeded.session_id,
    initial_mastery: initial,
    atoms,
  });

  const next = runUntilPauseOrDone(persona, state);
  fs.mkdirSync(args.out_dir, { recursive: true });
  writeTrialReport(args.out_dir, next);

  if (next.status === 'paused' && next.pending) {
    console.log('');
    console.log(`[SCENARIO PAUSED] Atom ${next.pending.atom.id} needs human input:`);
    console.log(`  ${next.pending.reason}`);
    console.log(`  resume:  npm run demo:scenario:resume ${path.basename(args.out_dir)}`);
    process.exit(0);
  }

  console.log(`[scenario] done. mastery ${next.initial_mastery.toFixed(2)} → ${next.current_mastery.toFixed(2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
