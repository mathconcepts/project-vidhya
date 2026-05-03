#!/usr/bin/env -S npx tsx
/**
 * scripts/run-scenario.ts
 *
 * CLI: drive a SCRIPTED PERSONA through N atoms of a concept and dump a
 * deterministic trial report.
 *
 *   npm run demo:scenario <persona-id> <concept-id> [--atoms 5] [--out PATH]
 *
 * The trial report is the regression artifact: re-running with the same
 * persona + concept produces identical output (modulo timestamps).
 *
 * What this DOES NOT do (deferred to PR-A2):
 *   - Pause + resume on interactive atoms (HIL flow). v1 marks them
 *     `needs_human` in the trial and continues past them.
 */

import fs from 'fs';
import path from 'path';
import { loadPersona, listPersonaIds } from '../src/scenarios/persona-loader';
import { applyPolicy, type AtomShape } from '../src/scenarios/policy-runner';
import { seedPersona } from '../src/scenarios/persona-seeder';

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
    out_dir: outDir || path.join(process.cwd(), '.data', 'scenarios', runId),
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

  // ---- seed the persona's student_model row ----------------------------
  let seeded;
  try {
    seeded = await seedPersona(persona);
    console.log(`[scenario] seeded user_id=${seeded.user_id}`);
  } catch (err) {
    console.error(`[scenario] FATAL: seeding failed: ${(err as Error).message}`);
    process.exit(2);
  }

  // ---- load atoms -------------------------------------------------------
  const allAtoms = await loadConceptAtoms(args.concept_id);
  if (allAtoms.length === 0) {
    console.error(`[scenario] no atoms found for concept ${args.concept_id}`);
    process.exit(3);
  }
  const atoms = allAtoms.slice(0, args.atoms);

  // ---- drive the policy -------------------------------------------------
  let mastery = persona.seed.initial_mastery[args.concept_id] ?? 0.3;
  const events: any[] = [];

  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i];
    const result = applyPolicy({
      persona,
      atom,
      atom_idx: i,
      mastery,
      first_exposure: i === 0,
    });

    if (result.kind === 'answer') {
      const delta = result.correct ? +0.05 : -0.02;
      mastery = Math.max(0, Math.min(1, mastery + delta));
    }

    events.push({
      idx: i,
      atom_id: atom.id,
      atom_type: atom.atom_type,
      result,
      mastery_after: mastery,
    });
  }

  // ---- write the report ------------------------------------------------
  fs.mkdirSync(args.out_dir, { recursive: true });
  const trial = {
    schema_version: 1,
    run_id: path.basename(args.out_dir),
    persona_id: persona.id,
    concept_id: args.concept_id,
    user_id: seeded.user_id,
    session_id: seeded.session_id,
    started_at: new Date().toISOString(),
    initial_mastery: persona.seed.initial_mastery[args.concept_id] ?? 0.3,
    final_mastery: mastery,
    delta: mastery - (persona.seed.initial_mastery[args.concept_id] ?? 0.3),
    events,
  };
  fs.writeFileSync(path.join(args.out_dir, 'trial.json'), JSON.stringify(trial, null, 2));

  // Markdown digest
  const md: string[] = [
    `# Scenario: ${persona.display_name}`,
    `Concept: \`${args.concept_id}\``,
    `Mastery: ${trial.initial_mastery.toFixed(2)} → ${trial.final_mastery.toFixed(2)} (Δ ${trial.delta >= 0 ? '+' : ''}${trial.delta.toFixed(2)})`,
    '',
    '| # | atom | result | rule | mastery |',
    '|---|------|--------|------|---------|',
  ];
  for (const e of events) {
    const r = e.result.kind === 'answer'
      ? (e.result.correct ? '✓' : '✗')
      : '⏸ human';
    const rule = e.result.kind === 'answer' ? e.result.via_rule : e.result.reason;
    md.push(`| ${e.idx} | \`${e.atom_id}\` | ${r} | ${rule} | ${e.mastery_after.toFixed(2)} |`);
  }
  fs.writeFileSync(path.join(args.out_dir, 'digest.md'), md.join('\n'));

  console.log(`[scenario] done. mastery ${trial.initial_mastery.toFixed(2)} → ${trial.final_mastery.toFixed(2)}`);
  console.log(`[scenario] report: ${args.out_dir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
