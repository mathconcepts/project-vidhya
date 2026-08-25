#!/usr/bin/env npx tsx
/**
 * frontend/scripts/generate-intent-slices.ts
 *
 * Codegen for the Definite Problem Statement (DPS) data slice (Phase 2, T4).
 *
 * Reads:
 *   data/curriculum/gate-em/atomic-catalogue.json  (203 atoms → concept_ids,
 *     subtopic, gate_examination_intent, primary_pain_point)
 *   frontend/public/data/pyq-bank.json              (mapped PYQs → concept_ids)
 *   src/blueprints/intent-tables.gen.ts              (already-generated
 *     CONCEPT_DOMINANT_INTENT / INTENT_STAGE_SEQUENCES / CONCEPT_INVENTORY_TOTALS
 *     — reused here, never re-derived, per the T4 task's explicit instruction)
 *
 * — and emits `frontend/src/generated/intent-slices.gen.ts`, a small
 * checked-in generated module: one `IntentSlice` per concept that has a
 * dominant intent (19 Linear Algebra concepts today). The emitted file is
 * self-contained (no imports) so it never pulls backend modules into the
 * Vite bundle — it carries labels and counts only, never question text.
 *
 * Determinism: concepts are emitted in sorted-key order, each concept's
 * mapped atoms are sorted by atomic_id before any "representative atom"
 * pick, so running this script twice against unchanged inputs produces a
 * byte-identical file (verified by a drift test).
 *
 * Regenerate after editing the catalogue, the PYQ bank's concept mapping,
 * or intent-tables.gen.ts:
 *
 *     cd frontend && npm run gen:intent-slices
 *     # or: npx tsx frontend/scripts/generate-intent-slices.ts
 *
 * Honesty rule (design doc §5, "no fabricated number"): a concept only
 * gets a slice when it has ≥1 mapped catalogue atom. pyq_count is a real
 * count from the PYQ bank's concept mapping, never a guess — zero is a
 * valid, honestly-rendered value (the DPS component itself decides to
 * omit the PYQ sentence when pyq_count is 0; the codegen never hides it).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CONCEPT_DOMINANT_INTENT,
  INTENT_STAGE_SEQUENCES,
  CONCEPT_INVENTORY_TOTALS,
  type IntentId,
} from '../../src/blueprints/intent-tables.gen';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const OUTPUT_PATH = path.join(ROOT, 'frontend/src/generated/intent-slices.gen.ts');
export const CATALOGUE_PATH = path.join(ROOT, 'data/curriculum/gate-em/atomic-catalogue.json');
export const PYQ_BANK_PATH = path.join(ROOT, 'frontend/public/data/pyq-bank.json');

// ---------------------------------------------------------------------------
// Shapes (structural — deliberately loose, mirrors check-intent-catalogue.ts's
// own approach so injected test fixtures don't need the full runtime type).
// ---------------------------------------------------------------------------

export interface CatalogueAtomLike {
  atomic_id: string;
  subtopic: string;
  intent: string;
  gate_examination_intent: string;
  primary_pain_point: string;
  concept_ids?: string[];
  question_inventory?: { target_total?: number };
  [key: string]: unknown;
}

export interface PyqProblemLike {
  concept_id?: string;
  concept_ids?: string[];
  [key: string]: unknown;
}

export interface IntentSlice {
  concept_id: string;
  dominant_intent: IntentId;
  pain_point: string;
  exam_intent: string;
  subtopics: string[];
  pyq_count: number;
  inventory_total: number;
  stage_order: string[];
}

// ---------------------------------------------------------------------------
// Loaders — the only I/O. Pure builders below take already-parsed data.
// ---------------------------------------------------------------------------

export function loadCatalogueAtoms(filePath: string = CATALOGUE_PATH): CatalogueAtomLike[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Array.isArray(parsed.atoms) ? parsed.atoms : [];
}

export function loadPyqBankProblems(filePath: string = PYQ_BANK_PATH): PyqProblemLike[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Array.isArray(parsed.problems) ? parsed.problems : [];
}

/** concept_id → count of PYQ-bank problems mapped to it (concept_ids[] first, concept_id fallback). */
export function buildPyqConceptCounts(problems: PyqProblemLike[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of problems) {
    const ids = Array.isArray(p.concept_ids) && p.concept_ids.length > 0
      ? p.concept_ids
      : p.concept_id
        ? [p.concept_id]
        : [];
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Pure builder — no I/O. The drift test re-runs this against freshly loaded
// source files and compares against the committed gen file's actual export.
// ---------------------------------------------------------------------------

export function buildIntentSlices(
  atoms: CatalogueAtomLike[],
  pyqCounts: Map<string, number>,
  dominantIntent: Record<string, IntentId> = CONCEPT_DOMINANT_INTENT,
  stageSequences: Record<IntentId, { stage: string }[]> = INTENT_STAGE_SEQUENCES,
  inventoryTotals: Record<string, number> = CONCEPT_INVENTORY_TOTALS,
): Record<string, IntentSlice> {
  // Sort atoms by atomic_id FIRST so every per-concept atom list (and the
  // "representative atom" pick below) is deterministic regardless of the
  // catalogue's on-disk atom order.
  const sortedAtoms = [...atoms].sort((a, b) => a.atomic_id.localeCompare(b.atomic_id));

  const atomsByConceptId = new Map<string, CatalogueAtomLike[]>();
  for (const atom of sortedAtoms) {
    for (const conceptId of atom.concept_ids ?? []) {
      if (!(conceptId in dominantIntent)) continue; // only concepts with a dominant intent get a slice
      const list = atomsByConceptId.get(conceptId);
      if (list) list.push(atom);
      else atomsByConceptId.set(conceptId, [atom]);
    }
  }

  const result: Record<string, IntentSlice> = {};
  for (const conceptId of Object.keys(dominantIntent).sort()) {
    const mapped = atomsByConceptId.get(conceptId);
    if (!mapped || mapped.length === 0) continue; // honest: never emit a slice with no source atoms
    const dominant = dominantIntent[conceptId];
    // Representative atom for pain_point/exam_intent: the module's templated
    // rows share one value each (verified: every LA-module atom carries the
    // same primary_pain_point / gate_examination_intent), so any mapped atom
    // is representative — prefer one whose own intent matches the concept's
    // dominant intent, falling back to the first (already atomic_id-sorted).
    const rep = mapped.find((a) => a.intent === dominant) ?? mapped[0];
    result[conceptId] = {
      concept_id: conceptId,
      dominant_intent: dominant,
      pain_point: rep.primary_pain_point,
      exam_intent: rep.gate_examination_intent,
      subtopics: mapped.map((a) => a.subtopic),
      pyq_count: pyqCounts.get(conceptId) ?? 0,
      inventory_total: inventoryTotals[conceptId] ?? 0,
      stage_order: (stageSequences[dominant] ?? []).map((s) => s.stage),
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Rendering — turns the computed structure into the generated file's text.
// ---------------------------------------------------------------------------

function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function quoteArray(items: string[]): string {
  return `[${items.map(quote).join(', ')}]`;
}

function renderSlice(slice: IntentSlice): string {
  return [
    '  {',
    `    concept_id: ${quote(slice.concept_id)},`,
    `    dominant_intent: ${quote(slice.dominant_intent)},`,
    `    pain_point: ${quote(slice.pain_point)},`,
    `    exam_intent: ${quote(slice.exam_intent)},`,
    `    subtopics: ${quoteArray(slice.subtopics)},`,
    `    pyq_count: ${slice.pyq_count},`,
    `    inventory_total: ${slice.inventory_total},`,
    `    stage_order: ${quoteArray(slice.stage_order)},`,
    '  }',
  ].join('\n');
}

export function renderGeneratedFile(slices: Record<string, IntentSlice>): string {
  const conceptIds = Object.keys(slices).sort();
  const entries = conceptIds
    .map((id) => `  ${quote(id)}: ${renderSlice(slices[id]).trimStart()},`)
    .join('\n');

  return `/**
 * frontend/src/generated/intent-slices.gen.ts
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source of truth:
 *   data/curriculum/gate-em/atomic-catalogue.json
 *   frontend/public/data/pyq-bank.json
 *   src/blueprints/intent-tables.gen.ts
 *
 * Regenerate:
 *   cd frontend && npm run gen:intent-slices
 *   (or: npx tsx frontend/scripts/generate-intent-slices.ts)
 *
 * Edit the source files above, then regenerate — never edit this file
 * directly. A CI drift test re-runs the codegen's pure builder in-memory
 * and fails the build if this file is out of sync.
 *
 * Deliberately self-contained (no imports): this file ships into the
 * client bundle, so it carries only labels and counts — no question text,
 * no per-student data, no import of any backend module.
 */

/** Mirrors src/blueprints/intent-tables.gen.ts's IntentId — duplicated here
 * (not imported) so this file stays import-free for the client bundle. */
export type IntentId =
  | 'foundation_learning'
  | 'concept_clarification'
  | 'guided_problem_solving'
  | 'pyq_targeted_practice';

export interface IntentSlice {
  concept_id: string;
  dominant_intent: IntentId;
  /** The module-level pain point this concept's mapped atoms share (design
   * doc §5: "the pain point + the exam intent + the marks at stake"). */
  pain_point: string;
  /** What GATE actually tests on this concept (gate_examination_intent). */
  exam_intent: string;
  /** Subtopic labels of every catalogue atom mapped to this concept. */
  subtopics: string[];
  /** Count of PYQ-bank problems mapped to this concept. Honest — 0 is a
   * real value; the DPS renderer omits the PYQ sentence rather than the
   * codegen fabricating or hiding a nonzero count. */
  pyq_count: number;
  /** Sum of mapped atoms' question_inventory.target_total. */
  inventory_total: number;
  /** The dominant intent's stage sequence, stage kinds only, in order. */
  stage_order: string[];
}

/** Concepts present in CONCEPT_DOMINANT_INTENT with ≥1 mapped catalogue atom. */
export const INTENT_SLICES: Record<string, IntentSlice> = {
${entries}
};
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const atoms = loadCatalogueAtoms();
  const problems = loadPyqBankProblems();
  const pyqCounts = buildPyqConceptCounts(problems);

  const slices = buildIntentSlices(atoms, pyqCounts);
  const text = renderGeneratedFile(slices);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, text, 'utf-8');

  console.log(`[generate-intent-slices] wrote ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`[generate-intent-slices] ${Object.keys(slices).length} concept slices`);
  for (const conceptId of Object.keys(slices).sort()) {
    const s = slices[conceptId];
    console.log(`  ${conceptId} -> ${s.dominant_intent} (pyq_count=${s.pyq_count}, inventory=${s.inventory_total})`);
  }
}

if (process.argv[1]?.endsWith('generate-intent-slices.ts')) {
  main();
}
