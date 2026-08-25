#!/usr/bin/env npx tsx
/**
 * scripts/generate-intent-tables.ts
 *
 * Codegen for the intent-aware blueprint lookup tables (Phase 3, T5).
 *
 * Reads the two committed content-contract files —
 *   data/curriculum/gate-em/intent-profiles.yml    (4 intent lanes)
 *   data/curriculum/gate-em/atomic-catalogue.json   (203 atoms → concept_ids)
 * — and emits `src/blueprints/intent-tables.gen.ts`, a checked-in generated
 * module. This mirrors the pattern `src/constants/concept-graph.ts` documents
 * in its own header (YAML stays the single source of truth for lane
 * sequences; TS never hand-copies it) — except here the derived shape is
 * written to disk at build time rather than parsed at import time, because
 * the CI drift test (src/blueprints/__tests__/intent-tables-drift.test.ts)
 * needs a stable committed artifact to diff against, and `src/` must not
 * gain a new runtime YAML/JSON parser (constraint from the T5 task doc).
 *
 * Regenerate after editing either source file:
 *
 *     npm run gen:intent-tables
 *     # or: npx tsx scripts/generate-intent-tables.ts
 *
 * Deterministic: concept-keyed records are emitted in sorted-key order and
 * intent-keyed records follow the fixed `INTENTS` order from
 * check-intent-catalogue.ts, so running this script twice with unchanged
 * inputs produces a byte-identical file (verified by a test).
 *
 * Reuses `check-intent-catalogue.ts`'s loaders + shape types rather than
 * re-parsing the two source files a second time — the same "one canonical
 * reader" discipline concept-graph.ts's header argues for. That gate must
 * pass before this script's output should be trusted; this script does not
 * re-run those checks itself (CI runs both independently).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadCatalogue,
  loadIntentProfiles,
  INTENTS,
  type CatalogueAtom,
  type IntentProfilesFile,
} from './check-intent-catalogue';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUTPUT_PATH = path.join(ROOT, 'src/blueprints/intent-tables.gen.ts');
export const SOURCE_INTENT_PROFILES = 'data/curriculum/gate-em/intent-profiles.yml';
export const SOURCE_ATOMIC_CATALOGUE = 'data/curriculum/gate-em/atomic-catalogue.json';

// ---------------------------------------------------------------------------
// Types mirrored from src/blueprints/types.ts (kept local — the generated
// file is the only src/ artifact that needs these shapes at runtime; this
// script itself stays outside src/).
// ---------------------------------------------------------------------------

export type IntentId = (typeof INTENTS)[number];

export interface GeneratedStage {
  stage: string;
  atom_kind: string;
  difficulty_mix?: { easy: number; medium: number; hard: number };
}

/**
 * Tie-break priority when a concept's mapped atoms split across intents
 * with equal counts (locked in the T5 task spec): the most-demanded intent
 * per the catalogue distribution wins. Iteration order below IS the
 * priority — first entry reaching the highest count wins.
 */
export const INTENT_PRIORITY: readonly IntentId[] = [
  'pyq_targeted_practice',
  'guided_problem_solving',
  'concept_clarification',
  'foundation_learning',
];

// ---------------------------------------------------------------------------
// Pure builders — no I/O. The drift test re-runs these against freshly
// loaded source files and compares against the committed gen file's actual
// exports.
// ---------------------------------------------------------------------------

/**
 * INTENT_STAGE_SEQUENCES: one default_stage_sequence per intent, with the
 * `presentation` hint stripped (BlueprintDecisionsV1 is a locked contract
 * that must never carry presentation — renderers derive it separately).
 */
export function buildIntentStageSequences(
  profiles: IntentProfilesFile,
): Record<IntentId, GeneratedStage[]> {
  const result = {} as Record<IntentId, GeneratedStage[]>;
  for (const intentId of INTENTS) {
    const profile = profiles.intents?.[intentId];
    const sequence = profile?.default_stage_sequence ?? [];
    result[intentId] = sequence.map((entry) => {
      const stage: GeneratedStage = {
        stage: entry.stage,
        atom_kind: entry.atom_kind,
      };
      if (entry.difficulty_mix) {
        const mix = entry.difficulty_mix as Record<string, number>;
        stage.difficulty_mix = {
          easy: mix.easy ?? 0,
          medium: mix.medium ?? 0,
          hard: mix.hard ?? 0,
        };
      }
      return stage;
    });
  }
  return result;
}

/**
 * CONCEPT_DOMINANT_INTENT: for every concept with ≥1 mapped atom, the
 * intent with the most mapped atoms, ties broken by INTENT_PRIORITY.
 * Keys sorted for diff-clean regen.
 */
export function buildConceptDominantIntent(atoms: CatalogueAtom[]): Record<string, IntentId> {
  const counts = new Map<string, Map<IntentId, number>>();
  for (const atom of atoms) {
    const conceptIds = atom.concept_ids ?? [];
    if (conceptIds.length === 0) continue;
    const intent = atom.intent as IntentId;
    for (const conceptId of conceptIds) {
      let byIntent = counts.get(conceptId);
      if (!byIntent) {
        byIntent = new Map();
        counts.set(conceptId, byIntent);
      }
      byIntent.set(intent, (byIntent.get(intent) ?? 0) + 1);
    }
  }

  const result: Record<string, IntentId> = {};
  for (const conceptId of [...counts.keys()].sort()) {
    const byIntent = counts.get(conceptId)!;
    let winner: IntentId = INTENT_PRIORITY[0];
    let winnerCount = -1;
    for (const intent of INTENT_PRIORITY) {
      const count = byIntent.get(intent) ?? 0;
      if (count > winnerCount) {
        winner = intent;
        winnerCount = count;
      }
    }
    result[conceptId] = winner;
  }
  return result;
}

/**
 * CONCEPT_INVENTORY_TOTALS: sum of mapped atoms' question_inventory.target_total
 * per concept (an atom mapped to N concepts contributes its full total to
 * each — the catalogue's own semantics; see atomic-catalogue.json's notes).
 * Keys sorted for diff-clean regen.
 */
export function buildConceptInventoryTotals(atoms: CatalogueAtom[]): Record<string, number> {
  const totals = new Map<string, number>();
  for (const atom of atoms) {
    const conceptIds = atom.concept_ids ?? [];
    if (conceptIds.length === 0) continue;
    const total = atom.question_inventory?.target_total ?? 0;
    for (const conceptId of conceptIds) {
      totals.set(conceptId, (totals.get(conceptId) ?? 0) + total);
    }
  }
  const result: Record<string, number> = {};
  for (const conceptId of [...totals.keys()].sort()) {
    result[conceptId] = totals.get(conceptId)!;
  }
  return result;
}

/**
 * DIFFICULTY_LABEL_FROM_CATALOGUE: the single declared vocabulary mapping
 * from the catalogue's difficulty_mix buckets (foundation/standard/stretch)
 * onto the blueprint contract's DifficultyLabel (easy/medium/hard). Static
 * by design — not derived from data, so it is written directly rather than
 * "built" from a source file.
 */
export const DIFFICULTY_LABEL_FROM_CATALOGUE: Record<'foundation' | 'standard' | 'stretch', string> = {
  foundation: 'easy',
  standard: 'medium',
  stretch: 'hard',
};

// ---------------------------------------------------------------------------
// Rendering — turns the computed structures into the generated file's text.
// ---------------------------------------------------------------------------

function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function renderStage(stage: GeneratedStage): string {
  let out = `{ stage: ${quote(stage.stage)}, atom_kind: ${quote(stage.atom_kind)}`;
  if (stage.difficulty_mix) {
    const m = stage.difficulty_mix;
    out += `, difficulty_mix: { easy: ${m.easy}, medium: ${m.medium}, hard: ${m.hard} }`;
  }
  out += ' }';
  return out;
}

function renderStageSequences(sequences: Record<IntentId, GeneratedStage[]>): string {
  const lines: string[] = ['export const INTENT_STAGE_SEQUENCES: Record<IntentId, GeneratedStage[]> = {'];
  for (const intentId of INTENTS) {
    lines.push(`  ${intentId}: [`);
    for (const stage of sequences[intentId]) {
      lines.push(`    ${renderStage(stage)},`);
    }
    lines.push('  ],');
  }
  lines.push('};');
  return lines.join('\n');
}

function renderDominantIntent(map: Record<string, IntentId>): string {
  const lines: string[] = ['export const CONCEPT_DOMINANT_INTENT: Record<string, IntentId> = {'];
  for (const conceptId of Object.keys(map).sort()) {
    lines.push(`  ${quote(conceptId)}: ${quote(map[conceptId])},`);
  }
  lines.push('};');
  return lines.join('\n');
}

function renderInventoryTotals(map: Record<string, number>): string {
  const lines: string[] = ['export const CONCEPT_INVENTORY_TOTALS: Record<string, number> = {'];
  for (const conceptId of Object.keys(map).sort()) {
    lines.push(`  ${quote(conceptId)}: ${map[conceptId]},`);
  }
  lines.push('};');
  return lines.join('\n');
}

function renderDifficultyLabelMap(map: Record<'foundation' | 'standard' | 'stretch', string>): string {
  const lines: string[] = [
    "export const DIFFICULTY_LABEL_FROM_CATALOGUE: Record<'foundation' | 'standard' | 'stretch', DifficultyLabel> = {",
    `  foundation: ${quote(map.foundation)},`,
    `  standard: ${quote(map.standard)},`,
    `  stretch: ${quote(map.stretch)},`,
    '};',
  ];
  return lines.join('\n');
}

export function renderGeneratedFile(
  sequences: Record<IntentId, GeneratedStage[]>,
  dominantIntent: Record<string, IntentId>,
  inventoryTotals: Record<string, number>,
  difficultyLabelMap: Record<'foundation' | 'standard' | 'stretch', string>,
): string {
  return `/**
 * src/blueprints/intent-tables.gen.ts
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth:
 *   ${SOURCE_INTENT_PROFILES}
 *   ${SOURCE_ATOMIC_CATALOGUE}
 *
 * Regenerate:
 *   npm run gen:intent-tables
 *   (or: npx tsx scripts/generate-intent-tables.ts)
 *
 * Edit the YAML/JSON sources above, then regenerate — never edit this file
 * directly. A CI drift test (src/blueprints/__tests__/intent-tables-drift.test.ts)
 * fails the build if this file is out of sync with the sources.
 *
 * \`presentation\` hints from intent-profiles.yml are intentionally stripped
 * here — BlueprintDecisionsV1 (src/blueprints/types.ts) is a locked contract
 * that must never carry a presentation field; renderers derive presentation
 * separately from (intent × stage) later in the pipeline.
 */

import type { StageKind, AtomKind, DifficultyMix, DifficultyLabel } from './types';

export type IntentId =
  | 'foundation_learning'
  | 'concept_clarification'
  | 'guided_problem_solving'
  | 'pyq_targeted_practice';

export interface GeneratedStage {
  stage: StageKind;
  atom_kind: AtomKind;
  difficulty_mix?: DifficultyMix;
}

${renderStageSequences(sequences)}

${renderDominantIntent(dominantIntent)}

${renderInventoryTotals(inventoryTotals)}

${renderDifficultyLabelMap(difficultyLabelMap)}
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const catalogue = loadCatalogue();
  const profiles = loadIntentProfiles();
  const atoms = catalogue.atoms ?? [];

  const sequences = buildIntentStageSequences(profiles);
  const dominantIntent = buildConceptDominantIntent(atoms);
  const inventoryTotals = buildConceptInventoryTotals(atoms);

  const text = renderGeneratedFile(sequences, dominantIntent, inventoryTotals, DIFFICULTY_LABEL_FROM_CATALOGUE);
  fs.writeFileSync(OUTPUT_PATH, text, 'utf-8');

  console.log(`[generate-intent-tables] wrote ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`[generate-intent-tables] ${Object.keys(dominantIntent).length} concepts with a dominant intent`);
  for (const conceptId of Object.keys(dominantIntent).sort()) {
    console.log(`  ${conceptId} -> ${dominantIntent[conceptId]} (inventory=${inventoryTotals[conceptId] ?? 0})`);
  }
}

if (process.argv[1]?.endsWith('generate-intent-tables.ts')) {
  main().catch((e) => {
    console.error('[generate-intent-tables] Fatal error:', e);
    process.exit(1);
  });
}
