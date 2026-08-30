/**
 * atomic-topic-spec.ts — typed access to docs/content-spec/, the founder's
 * per-subtopic content-generation specification (116 GATE Engineering
 * Mathematics atomic topics: recommended hooks, base sequence, delta
 * slots, quality gates, evidence status).
 *
 * Why this exists: the spec used to live only as an ad-hoc upload with no
 * durable home in the repo — the exact failure mode the founder flagged
 * ("this needs to be updated and up to date all the time and content
 * generation might refer to this all the time"). docs/content-spec/ is now
 * that durable home (six files: two structure-map CSVs, the integrated
 * self-improving-learning-system design doc, research notes, and the
 * target relational schema for the eventual base+delta content system).
 * This module is the first real (not just filed-away) consumer: a typed
 * loader over the two CSVs, keyed by `atomic_id` (e.g. "LA-06").
 *
 * Scope, deliberately: this loader does NOT yet auto-map `atomic_id` to
 * this codebase's `concept_id` (src/constants/concept-graph.ts). The two
 * id spaces were authored independently — atomic_id groups by exam
 * syllabus section (LA-01..LA-11, CA-01..), concept_id by this app's own
 * concept graph (e.g. "eigenvalues", "rank-nullity") — and nothing here
 * has verified a row-by-row correspondence between the two. Fabricating
 * that mapping without verification would be worse than not having it:
 * a wrong mapping silently steers content generation for the wrong
 * concept, exactly the kind of error this spec exists to prevent. Callers
 * that know a concept's atomic_id (an operator picking from the catalogue,
 * or a future verified mapping table) can look it up directly; nothing
 * here guesses one from a concept_id.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// This package is `"type": "module"` and the server boots via `npx tsx
// src/server.ts` (Dockerfile CMD), so `__dirname` is genuinely undefined
// here — referencing it threw `ReferenceError: __dirname is not defined in
// ES module scope` at module-evaluation time, which is BEFORE any route
// handler runs. `src/server.ts` -> `admin-content-spec-routes.ts` ->
// this file is an unconditional import chain, so that ReferenceError took
// the whole server down at boot on every deploy. Vitest injects a
// `__dirname` shim into transformed modules, which is why the test suite
// never saw it. Resolve from `import.meta.url` instead — correct under
// tsx, vitest, and a compiled ESM build alike.
const SPEC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/content-spec');
const STRUCTURE_MAP_CSV = path.join(SPEC_DIR, 'atomic-content-structure-map.csv');
const GENERATION_SPECS_CSV = path.join(SPEC_DIR, 'atomic-content-generation-specs.csv');

/** One `|`-delimited CSV cell, split into its parts. Empty cell → []. */
function splitPipes(cell: string): string[] {
  return cell ? cell.split('|').filter(Boolean) : [];
}

/**
 * Minimal RFC4180-ish CSV line splitter: handles double-quoted fields
 * (including embedded commas and escaped `""`), assumes one row is one
 * line (verified true for both source files — 117 lines each, header +
 * 116 topics, no field contains a raw newline).
 */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = cells[i] ?? '';
    });
    return row;
  });
}

/**
 * The structure-map row for one atomic topic — recommended hooks, base
 * sequence, asset formats, delta slots, and the attention-design /
 * content-contract prose (docs/content-spec/atomic-content-structure-map.csv).
 */
export interface AtomicTopicStructure {
  atomic_id: string;
  domain: string;
  atomic_subtopic: string;
  papers: string[];
  assessment_modes: string[];
  template_family: string;
  recommended_hooks: string[];
  base_sequence: string[];
  recommended_asset_formats: string[];
  personalized_delta_slots: string[];
  attention_design_hypothesis: string;
  base_content_contract: string;
  evidence_status: string;
}

/**
 * The generation-pipeline row for one atomic topic — prerequisites,
 * quality gates, generated-artifact list, monitoring metrics
 * (docs/content-spec/atomic-content-generation-specs.csv).
 */
export interface AtomicTopicGenerationSpec {
  atomic_id: string;
  domain: string;
  atomic_subtopic: string;
  papers: string[];
  assessment_modes: string[];
  prerequisite_atomic_ids: string[];
  downstream_atomic_ids: string[];
  external_prerequisite_family: string;
  template_family: string;
  hooks: string[];
  base_sequence: string[];
  asset_formats: string[];
  delta_slots: string[];
  research_layers_required: string[];
  generated_artifacts: string[];
  quality_gates: string[];
  monitoring_metrics: string[];
  evidence_status: string;
}

export interface AtomicTopicSpec {
  atomic_id: string;
  structure: AtomicTopicStructure;
  generation: AtomicTopicGenerationSpec;
}

let _cache: Map<string, AtomicTopicSpec> | null = null;

function toStructure(row: Record<string, string>): AtomicTopicStructure {
  return {
    atomic_id: row.atomic_id,
    domain: row.domain,
    atomic_subtopic: row.atomic_subtopic,
    papers: splitPipes(row.papers),
    assessment_modes: splitPipes(row.assessment_modes),
    template_family: row.template_family,
    recommended_hooks: splitPipes(row.recommended_hooks),
    base_sequence: splitPipes(row.base_sequence),
    recommended_asset_formats: splitPipes(row.recommended_asset_formats),
    personalized_delta_slots: splitPipes(row.personalized_delta_slots),
    attention_design_hypothesis: row.attention_design_hypothesis,
    base_content_contract: row.base_content_contract,
    evidence_status: row.evidence_status,
  };
}

function toGenerationSpec(row: Record<string, string>): AtomicTopicGenerationSpec {
  return {
    atomic_id: row.atomic_id,
    domain: row.domain,
    atomic_subtopic: row.atomic_subtopic,
    papers: splitPipes(row.papers),
    assessment_modes: splitPipes(row.assessment_modes),
    prerequisite_atomic_ids: splitPipes(row.prerequisite_atomic_ids),
    downstream_atomic_ids: splitPipes(row.downstream_atomic_ids),
    external_prerequisite_family: row.external_prerequisite_family,
    template_family: row.template_family,
    hooks: splitPipes(row.hooks),
    base_sequence: splitPipes(row.base_sequence),
    asset_formats: splitPipes(row.asset_formats),
    delta_slots: splitPipes(row.delta_slots),
    research_layers_required: splitPipes(row.research_layers_required),
    generated_artifacts: splitPipes(row.generated_artifacts),
    quality_gates: splitPipes(row.quality_gates),
    monitoring_metrics: splitPipes(row.monitoring_metrics),
    evidence_status: row.evidence_status,
  };
}

/**
 * Loads and merges both CSVs into one map keyed by atomic_id. Memoized —
 * both files are small (~200KB combined) and static within a process
 * lifetime; call `__resetAtomicTopicSpecCacheForTests()` in tests that
 * swap the underlying files.
 */
export function loadAtomicTopicSpecs(): Map<string, AtomicTopicSpec> {
  if (_cache) return _cache;
  const map = new Map<string, AtomicTopicSpec>();
  let structureRows: Array<Record<string, string>> = [];
  let generationRows: Array<Record<string, string>> = [];
  try {
    structureRows = parseCsv(fs.readFileSync(STRUCTURE_MAP_CSV, 'utf-8'));
  } catch {
    /* spec files are optional — callers must treat a missing entry as
       "no spec available", never as an error. */
  }
  try {
    generationRows = parseCsv(fs.readFileSync(GENERATION_SPECS_CSV, 'utf-8'));
  } catch {
    /* same as above */
  }
  const structureById = new Map(structureRows.map((r) => [r.atomic_id, toStructure(r)]));
  const generationById = new Map(generationRows.map((r) => [r.atomic_id, toGenerationSpec(r)]));
  const allIds = new Set([...structureById.keys(), ...generationById.keys()]);
  for (const id of allIds) {
    const structure = structureById.get(id);
    const generation = generationById.get(id);
    if (!structure || !generation) continue; // only merge ids present in both files
    map.set(id, { atomic_id: id, structure, generation });
  }
  _cache = map;
  return map;
}

/** Look up one atomic topic's spec by id (e.g. "LA-06"). Null if unknown. */
export function getAtomicTopicSpec(atomicId: string): AtomicTopicSpec | null {
  return loadAtomicTopicSpecs().get(atomicId) ?? null;
}

/** All atomic topics whose `domain` matches (case-sensitive, exact). */
export function listAtomicTopicSpecsByDomain(domain: string): AtomicTopicSpec[] {
  return [...loadAtomicTopicSpecs().values()].filter((s) => s.structure.domain === domain);
}

/** Test-only: drop the memoized parse so a test fixture takes effect. */
export function __resetAtomicTopicSpecCacheForTests(): void {
  _cache = null;
}
