#!/usr/bin/env npx tsx
/**
 * scripts/check-intent-catalogue.ts
 *
 * Intent Catalogue CI gate. Validates the three files that make up the
 * demand-side content contract for GATE Engineering Mathematics:
 *
 *   A) data/curriculum/gate-em/atomic-catalogue.json — the 203 atomic
 *      sub-topics (one row per demand-side query cluster).
 *   B) data/curriculum/gate-em/intent-profiles.yml — the 4 intent lanes +
 *      8 module pain profiles that route those atoms to content shape.
 *   B) data/curriculum/gate-em/historical-evidence.yml (W1.2/E10, added
 *      2026-08-27) — 116 corpus topic ids → {pattern, evidence: D|P|S}, the
 *      market-research corpus's own historical-question-pattern provenance
 *      (NOT this repo's atomic_id/concept_id scheme — see the file's own
 *      header for the id-scheme boundary and the 3-paper evidence-scope
 *      caveat). Numbered under section B (supplementary gate-em data files,
 *      not just intent-profiles.yml) rather than a new section — see B7.
 *
 * A8 and B6 (added alongside historical-evidence.yml) are the OTHER half of
 * W1.2/E10's phrase rule: atomic-catalogue's `seo.title` and intent-profiles'
 * `problem_statement_frame` may not contain "high-yield" / "frequently
 * asked" / "most repeated" / "often asked" — see
 * src/content/evidence-phrase-rule.ts (shared with check-practice-items.ts's
 * mirror check over practice items + the PYQ bank).
 *
 * All three files describe CONTENT, not students — there is nothing here to
 * guard against surveillance drift (contrast check-syllabus-floor.ts /
 * personalization's invariant suite). The risk this gate closes is
 * ordinary data-integrity drift: an id typo, a split that no longer sums,
 * a stage/atom_kind that doesn't exist in the runtime vocabulary, or an
 * atom-level prerequisite edge that silently contradicts the concept
 * graph's actual teaching order.
 *
 * Design: every check is a pure function over already-parsed data
 * (`CatalogueAtom[]`, `IntentProfilesFile`, `ConceptLike[]`) — no atom
 * function reads a file. The CLI wrapper (`main()`) is the only I/O:
 * it reads the two files, imports the real concept graph, runs every
 * check, and renders the report. This mirrors check-la-walkthrough.ts's
 * split between pure evaluators and a thin `main()`, done here for
 * direct unit-testability instead of subprocess spawning — these checks
 * have no filesystem fan-out to isolate, so injecting fixture objects is
 * simpler and faster than building fixture trees.
 *
 * Concept ids are read via `ALL_CONCEPTS` from `src/constants/concept-graph.ts`
 * — the same loader check-syllabus-floor.ts and check-la-walkthrough.ts
 * already use — rather than re-parsing `data/curriculum/gate-ma.yml`'s
 * `concepts:` section a second time. concept-graph.ts's own header
 * explains why: it is the SINGLE canonical loader for that YAML section
 * precisely so dozens of consumers (this gate now among them) can't drift
 * from it the way `resolveProviderForModel()`'s three copies did (see
 * CLAUDE.md's "Multi-Provider LLM Support" postmortem). A second hand-rolled
 * YAML-section parser here would be exactly that failure class, not an
 * independent check.
 *
 * Usage:
 *   npx tsx scripts/check-intent-catalogue.ts               # blocking (default)
 *   npx tsx scripts/check-intent-catalogue.ts --report-only  # prints, exits 0
 *   npx tsx scripts/check-intent-catalogue.ts --pain-points  # register report, exits 0
 *
 * Exit: 0 = every check passes (or --report-only / --pain-points was passed).
 *       1 = at least one check has violations, blocking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import { ATOM_KINDS, STAGE_KINDS } from '../src/blueprints/types';
import { findForbiddenPhrases } from '../src/content/evidence-phrase-rule';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const CATALOGUE_PATH = path.join(ROOT, 'data/curriculum/gate-em/atomic-catalogue.json');
export const INTENT_PROFILES_PATH = path.join(ROOT, 'data/curriculum/gate-em/intent-profiles.yml');

export const EXPECTED_ATOM_COUNT = 203;
export const ATOMIC_ID_RE = /^AT-\d{3}$/;

/**
 * The 4 intents. Locked — mirrors intent-profiles.yml's own header
 * ("schema_version 1 is locked. Shape changes ship as schema_version 2.").
 */
export const INTENTS = [
  'foundation_learning',
  'concept_clarification',
  'guided_problem_solving',
  'pyq_targeted_practice',
] as const;
export type Intent = (typeof INTENTS)[number];
const INTENT_SET: ReadonlySet<string> = new Set(INTENTS);

/**
 * Mirrors src/core/interfaces.ts's ErrorTag union (W3.4/E4 extended it from
 * 6 to 13 members — see that type's own doc comment for the full lockstep
 * list) —
 *   export type ErrorTag = 'sign' | 'unit' | 'misread' | 'transcription' | 'method' | 'careless' | 'method_selection' | 'representation' | 'mode_msq' | 'mode_nat_entry' | 'time_pressure' | 'risk_decision' | 'prerequisite';
 * Deliberately NOT imported (it's a type, erased at runtime). A vitest
 * drift tripwire (src/__tests__/unit/scripts/check-intent-catalogue.test.ts)
 * reads that file's source text and asserts the literal union members
 * match this array exactly, so this constant can't silently go stale.
 */
export const ERROR_TAGS = [
  'sign', 'unit', 'misread', 'transcription', 'method', 'careless',
  'method_selection', 'representation', 'mode_msq', 'mode_nat_entry',
  'time_pressure', 'risk_decision', 'prerequisite',
] as const;
const ERROR_TAG_SET: ReadonlySet<string> = new Set(ERROR_TAGS);

// ---------------------------------------------------------------------------
// Shapes (structural — deliberately loose so injected test fixtures don't
// need to satisfy the full runtime types elsewhere in the codebase).
// ---------------------------------------------------------------------------

export interface QuestionInventory {
  target_total: number;
  mcq_target: number;
  msq_target: number;
  nat_target: number;
  pyq_variant_target: number;
  difficulty_mix: Record<string, number>;
}

export interface CatalogueAtom {
  atomic_id: string;
  module: string;
  intent: string;
  question_inventory: QuestionInventory;
  prerequisite_atomic_ids: string[];
  concept_ids: string[];
  seo?: { title?: string; primary_keyword?: string };
  [key: string]: unknown;
}

export interface AtomicCatalogueFile {
  schema_version?: unknown;
  notes?: unknown;
  atoms: CatalogueAtom[];
  [key: string]: unknown;
}

export interface StageSequenceEntry {
  stage: string;
  atom_kind: string;
  presentation?: string;
  difficulty_mix?: Record<string, number>;
  [key: string]: unknown;
}

export interface IntentProfile {
  default_stage_sequence: StageSequenceEntry[];
  problem_statement_frame?: string;
  [key: string]: unknown;
}

export interface ModuleProfile {
  error_tags?: { existing?: unknown[]; proposed?: unknown[] };
  [key: string]: unknown;
}

export interface IntentProfilesFile {
  schema_version?: unknown;
  intents: Record<string, IntentProfile>;
  module_profiles: Record<string, ModuleProfile>;
  [key: string]: unknown;
}

/** Minimal structural shape of a concept-graph node — just what these checks need. */
export interface ConceptLike {
  id: string;
  prerequisites: string[];
}

// ---------------------------------------------------------------------------
// Result plumbing
// ---------------------------------------------------------------------------

export interface CheckResult {
  name: string;
  pass: boolean;
  /** Number of items that failed this check (0 when pass is true). */
  count: number;
  violations: string[];
}

function result(name: string, violations: string[]): CheckResult {
  return { name, pass: violations.length === 0, count: violations.length, violations };
}

// ---------------------------------------------------------------------------
// Section A — atomic-catalogue.json
// ---------------------------------------------------------------------------

/** A1: exactly 203 atoms; atomic_id unique, matching /^AT-\d{3}$/. */
export function checkA1_CountAndIds(atoms: CatalogueAtom[]): CheckResult {
  const violations: string[] = [];

  if (atoms.length !== EXPECTED_ATOM_COUNT) {
    violations.push(`expected exactly ${EXPECTED_ATOM_COUNT} atoms, found ${atoms.length}`);
  }

  const seen = new Map<string, number>();
  for (const a of atoms) {
    if (!ATOMIC_ID_RE.test(a.atomic_id)) {
      violations.push(`${a.atomic_id}: atomic_id does not match ${ATOMIC_ID_RE}`);
    }
    seen.set(a.atomic_id, (seen.get(a.atomic_id) ?? 0) + 1);
  }
  for (const [id, n] of seen) {
    if (n > 1) violations.push(`${id}: atomic_id appears ${n} times (must be unique)`);
  }

  return result('A1 count+ids (203 atoms, unique AT-### ids)', violations);
}

/** A2: every intent is one of the 4 locked intents. */
export function checkA2_IntentEnum(atoms: CatalogueAtom[]): CheckResult {
  const violations: string[] = [];
  for (const a of atoms) {
    if (!INTENT_SET.has(a.intent)) {
      violations.push(`${a.atomic_id}: intent '${a.intent}' not in {${INTENTS.join(', ')}}`);
    }
  }
  return result('A2 intent enum', violations);
}

/**
 * A3: question_inventory arithmetic —
 *   mcq_target + msq_target + nat_target === target_total
 *   pyq_variant_target <= target_total   (overlay, not additive)
 *   difficulty_mix values sum to 100
 */
export function checkA3_QuestionInventory(atoms: CatalogueAtom[]): CheckResult {
  const violations: string[] = [];
  for (const a of atoms) {
    const qi = a.question_inventory;
    if (!qi) {
      violations.push(`${a.atomic_id}: missing question_inventory`);
      continue;
    }
    const sum = (qi.mcq_target ?? 0) + (qi.msq_target ?? 0) + (qi.nat_target ?? 0);
    if (sum !== qi.target_total) {
      violations.push(
        `${a.atomic_id}: mcq(${qi.mcq_target})+msq(${qi.msq_target})+nat(${qi.nat_target})=${sum} !== target_total(${qi.target_total})`,
      );
    }
    if (qi.pyq_variant_target > qi.target_total) {
      violations.push(
        `${a.atomic_id}: pyq_variant_target(${qi.pyq_variant_target}) > target_total(${qi.target_total}) — overlay must not exceed total`,
      );
    }
    const mix = qi.difficulty_mix ?? {};
    const mixSum = Object.values(mix).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
    if (mixSum !== 100) {
      violations.push(`${a.atomic_id}: difficulty_mix sums to ${mixSum}, expected 100 (${JSON.stringify(mix)})`);
    }
  }
  return result('A3 question_inventory arithmetic', violations);
}

/** A4: every id in prerequisite_atomic_ids exists in the catalogue. */
export function checkA4_PrereqAtomsExist(atoms: CatalogueAtom[]): CheckResult {
  const violations: string[] = [];
  const ids = new Set(atoms.map((a) => a.atomic_id));
  for (const a of atoms) {
    for (const prereqId of a.prerequisite_atomic_ids ?? []) {
      if (!ids.has(prereqId)) {
        violations.push(`${a.atomic_id}: prerequisite_atomic_ids references unknown atom '${prereqId}'`);
      }
    }
  }
  return result('A4 prerequisite_atomic_ids resolve', violations);
}

/** A5: every id in concept_ids exists in the concept graph. */
export function checkA5_ConceptIdsExist(atoms: CatalogueAtom[], conceptIds: ReadonlySet<string>): CheckResult {
  const violations: string[] = [];
  for (const a of atoms) {
    for (const cid of a.concept_ids ?? []) {
      if (!conceptIds.has(cid)) {
        violations.push(`${a.atomic_id}: concept_ids references unknown concept '${cid}'`);
      }
    }
  }
  return result('A5 concept_ids resolve against concept graph', violations);
}

/** A6: all module === 'linear-algebra' atoms have non-empty concept_ids. */
export function checkA6_LaFullyMapped(atoms: CatalogueAtom[]): CheckResult {
  const violations: string[] = [];
  for (const a of atoms) {
    if (a.module === 'linear-algebra' && (!a.concept_ids || a.concept_ids.length === 0)) {
      violations.push(`${a.atomic_id}: module='linear-algebra' but concept_ids is empty`);
    }
  }
  return result('A6 linear-algebra fully concept-mapped', violations);
}

/**
 * A7: cross-DAG prerequisite consistency.
 *
 * For every atom edge A --requires--> B (B in A.prerequisite_atomic_ids,
 * i.e. B must be learned before A), where both A and B declare
 * concept_ids, it must NOT be the case that some concept of B
 * transitively requires (via the concept graph's own `prerequisites`
 * edges) some concept of A. That would mean the concept graph puts a
 * concept of A strictly before a concept of B — the opposite order the
 * atom edge asserts.
 */
export function checkA7_CrossDagConsistency(atoms: CatalogueAtom[], concepts: ConceptLike[]): CheckResult {
  const violations: string[] = [];

  const byId = new Map(concepts.map((c) => [c.id, c]));
  const ancestorCache = new Map<string, Set<string>>();

  // Transitive closure of `prerequisites` for one concept: every concept it
  // (directly or indirectly) requires. Memoized; guards against a cyclic
  // fixture (the real graph is asserted acyclic elsewhere) with a visited set.
  function ancestorsOf(conceptId: string): Set<string> {
    const cached = ancestorCache.get(conceptId);
    if (cached) return cached;

    const acc = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [conceptId];
    visiting.add(conceptId);

    while (stack.length > 0) {
      const current = stack.pop()!;
      const node = byId.get(current);
      if (!node) continue;
      for (const prereq of node.prerequisites ?? []) {
        if (acc.has(prereq)) continue;
        acc.add(prereq);
        if (!visiting.has(prereq)) {
          visiting.add(prereq);
          stack.push(prereq);
        }
      }
    }

    ancestorCache.set(conceptId, acc);
    return acc;
  }

  const byAtomicId = new Map(atoms.map((a) => [a.atomic_id, a]));

  for (const atomA of atoms) {
    if (!atomA.concept_ids || atomA.concept_ids.length === 0) continue;
    for (const prereqId of atomA.prerequisite_atomic_ids ?? []) {
      const atomB = byAtomicId.get(prereqId);
      if (!atomB || !atomB.concept_ids || atomB.concept_ids.length === 0) continue;

      for (const conceptBId of atomB.concept_ids) {
        const bAncestors = ancestorsOf(conceptBId);
        for (const conceptAId of atomA.concept_ids) {
          if (bAncestors.has(conceptAId)) {
            violations.push(
              `${atomA.atomic_id} requires ${atomB.atomic_id}, but concept '${conceptBId}' (of ${atomB.atomic_id}) ` +
                `transitively requires concept '${conceptAId}' (of ${atomA.atomic_id}) — atom edge inverts concept-graph order`,
            );
          }
        }
      }
    }
  }

  return result('A7 cross-DAG prerequisite consistency', violations);
}

/**
 * A8: W1.2/E10 phrase rule over atomic-catalogue.json's `seo.title` —
 * atoms carry no per-item `evidence_level` (that field lives on practice
 * items / PYQ bank entries, D10), so a forbidden phrase here is an absolute
 * ban, not a licensable claim. See src/content/evidence-phrase-rule.ts
 * (shared with check-practice-items.ts's phrase-rule check and B6 below).
 */
export function checkA8_SeoTitlePhraseRule(atoms: CatalogueAtom[]): CheckResult {
  const violations: string[] = [];
  for (const a of atoms) {
    const hits = findForbiddenPhrases(a.seo?.title);
    for (const hit of hits) {
      violations.push(
        `${a.atomic_id}: seo.title contains "${hit.phrase}" — catalogue atoms carry no evidence_level ` +
          `to license this claim; remove the phrase (fix: reword seo.title in atomic-catalogue.json)`,
      );
    }
  }
  return result('A8 seo.title phrase rule (no unsourced "high-yield"-style claims)', violations);
}

export function runCatalogueChecks(atoms: CatalogueAtom[], concepts: ConceptLike[]): CheckResult[] {
  const conceptIds = new Set(concepts.map((c) => c.id));
  return [
    checkA1_CountAndIds(atoms),
    checkA2_IntentEnum(atoms),
    checkA3_QuestionInventory(atoms),
    checkA4_PrereqAtomsExist(atoms),
    checkA5_ConceptIdsExist(atoms, conceptIds),
    checkA6_LaFullyMapped(atoms),
    checkA7_CrossDagConsistency(atoms, concepts),
    checkA8_SeoTitlePhraseRule(atoms),
  ];
}

// ---------------------------------------------------------------------------
// Section B — intent-profiles.yml
// ---------------------------------------------------------------------------

/** B1: exactly the 4 locked intents are present under intents:. */
export function checkB1_IntentSet(profiles: IntentProfilesFile): CheckResult {
  const violations: string[] = [];
  const present = new Set(Object.keys(profiles.intents ?? {}));

  for (const expected of INTENTS) {
    if (!present.has(expected)) violations.push(`intents.${expected} is missing`);
  }
  for (const actual of present) {
    if (!INTENT_SET.has(actual)) violations.push(`intents.${actual} is not one of the locked 4 intents`);
  }

  return result('B1 exactly the 4 locked intents', violations);
}

/** B2: every default_stage_sequence entry's stage/atom_kind is a real runtime value. */
export function checkB2_StageAndAtomKindValid(profiles: IntentProfilesFile): CheckResult {
  const violations: string[] = [];
  const stageSet: ReadonlySet<string> = new Set(STAGE_KINDS);
  const atomKindSet: ReadonlySet<string> = new Set(ATOM_KINDS);

  for (const [intentId, profile] of Object.entries(profiles.intents ?? {})) {
    (profile.default_stage_sequence ?? []).forEach((entry, i) => {
      if (!stageSet.has(entry.stage)) {
        violations.push(
          `intents.${intentId}.default_stage_sequence[${i}].stage '${entry.stage}' not in StageKind {${STAGE_KINDS.join(', ')}}`,
        );
      }
      if (!atomKindSet.has(entry.atom_kind)) {
        violations.push(
          `intents.${intentId}.default_stage_sequence[${i}].atom_kind '${entry.atom_kind}' not in AtomKind {${ATOM_KINDS.join(', ')}}`,
        );
      }
    });
  }

  return result('B2 stage/atom_kind valid (src/blueprints/types.ts)', violations);
}

/** B3: any difficulty_mix in a stage sums easy+medium+hard === 100. */
export function checkB3_DifficultyMixSums(profiles: IntentProfilesFile): CheckResult {
  const violations: string[] = [];

  for (const [intentId, profile] of Object.entries(profiles.intents ?? {})) {
    (profile.default_stage_sequence ?? []).forEach((entry, i) => {
      if (!entry.difficulty_mix) return;
      const { easy = 0, medium = 0, hard = 0 } = entry.difficulty_mix as Record<string, number>;
      const sum = easy + medium + hard;
      if (sum !== 100) {
        violations.push(
          `intents.${intentId}.default_stage_sequence[${i}].difficulty_mix sums to ${sum}, expected 100 ` +
            `(${JSON.stringify(entry.difficulty_mix)})`,
        );
      }
    });
  }

  return result('B3 stage difficulty_mix sums to 100', violations);
}

/** B4: module_profiles has exactly the modules that appear in the catalogue. */
export function checkB4_ModuleProfilesMatchCatalogue(
  profiles: IntentProfilesFile,
  catalogueModules: ReadonlySet<string>,
): CheckResult {
  const violations: string[] = [];
  const present = new Set(Object.keys(profiles.module_profiles ?? {}));

  for (const expected of catalogueModules) {
    if (!present.has(expected)) violations.push(`module_profiles.${expected} is missing (present in catalogue)`);
  }
  for (const actual of present) {
    if (!catalogueModules.has(actual)) {
      violations.push(`module_profiles.${actual} has no atoms in the catalogue`);
    }
  }

  return result('B4 module_profiles matches catalogue module set', violations);
}

/** B5: every error_tags.existing value is a member of the locked ErrorTag union. */
export function checkB5_ErrorTagsValid(profiles: IntentProfilesFile): CheckResult {
  const violations: string[] = [];

  for (const [moduleId, mp] of Object.entries(profiles.module_profiles ?? {})) {
    for (const tag of mp.error_tags?.existing ?? []) {
      if (typeof tag !== 'string' || !ERROR_TAG_SET.has(tag)) {
        violations.push(
          `module_profiles.${moduleId}.error_tags.existing has '${String(tag)}', not in ErrorTag {${ERROR_TAGS.join(', ')}}`,
        );
      }
    }
  }

  return result('B5 error_tags.existing ⊆ ErrorTag union', violations);
}

/**
 * B6: W1.2/E10 phrase rule over intent-profiles.yml's `problem_statement_frame`.
 * Same absolute-ban reasoning as A8 above — the four intent lanes carry no
 * per-item evidence_level, so a forbidden phrase here can never be licensed.
 */
export function checkB6_ProblemStatementFramePhraseRule(profiles: IntentProfilesFile): CheckResult {
  const violations: string[] = [];
  for (const [intentId, profile] of Object.entries(profiles.intents ?? {})) {
    const hits = findForbiddenPhrases(profile.problem_statement_frame);
    for (const hit of hits) {
      violations.push(
        `intents.${intentId}.problem_statement_frame contains "${hit.phrase}" — intent lanes carry no ` +
          `evidence_level to license this claim; reword problem_statement_frame in intent-profiles.yml`,
      );
    }
  }
  return result('B6 problem_statement_frame phrase rule', violations);
}

export function runIntentProfileChecks(
  profiles: IntentProfilesFile,
  catalogueModules: ReadonlySet<string>,
): CheckResult[] {
  return [
    checkB1_IntentSet(profiles),
    checkB2_StageAndAtomKindValid(profiles),
    checkB3_DifficultyMixSums(profiles),
    checkB4_ModuleProfilesMatchCatalogue(profiles, catalogueModules),
    checkB5_ErrorTagsValid(profiles),
    checkB6_ProblemStatementFramePhraseRule(profiles),
  ];
}

// ---------------------------------------------------------------------------
// Section B (continued) — historical-evidence.yml (W1.2/E10 D/P/S import)
// ---------------------------------------------------------------------------

export const HISTORICAL_EVIDENCE_PATH = path.join(ROOT, 'data/curriculum/gate-em/historical-evidence.yml');
export const EXPECTED_HISTORICAL_TOPIC_COUNT = 116;
export const HISTORICAL_EVIDENCE_ID_RE = /^[A-Z]{2,3}-\d{2}$/;
export const HISTORICAL_EVIDENCE_CODES = ['D', 'P', 'S'] as const;
const HISTORICAL_EVIDENCE_CODE_SET: ReadonlySet<string> = new Set(HISTORICAL_EVIDENCE_CODES);

export interface HistoricalEvidenceTopic {
  topic?: string;
  pattern: string;
  evidence: string;
  [key: string]: unknown;
}

export interface HistoricalEvidenceFile {
  schema_version?: unknown;
  source?: unknown;
  topics: Record<string, HistoricalEvidenceTopic>;
  [key: string]: unknown;
}

export function loadHistoricalEvidence(filePath: string = HISTORICAL_EVIDENCE_PATH): HistoricalEvidenceFile {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new IntentCatalogueParseError(filePath, err);
  }
  try {
    return parseYaml(raw) as HistoricalEvidenceFile;
  } catch (err) {
    throw new IntentCatalogueParseError(filePath, err);
  }
}

/**
 * B7: historical-evidence.yml structural validation — every key matches the
 * corpus's own `XX-##` topic-id shape, every entry has a non-empty
 * `pattern` string, and `evidence` is one of the source's own D/P/S codes
 * (never invented values — see the file's header for what each means and
 * the D/P resolution rule). Also checks the locked topic count matches the
 * 116-topic corpus import, mirroring A1's count-lock pattern for the
 * atomic-catalogue.
 */
export function checkB7_HistoricalEvidenceValid(evidence: HistoricalEvidenceFile): CheckResult {
  const violations: string[] = [];
  const topics = evidence.topics ?? {};
  const ids = Object.keys(topics);

  if (ids.length !== EXPECTED_HISTORICAL_TOPIC_COUNT) {
    violations.push(`expected exactly ${EXPECTED_HISTORICAL_TOPIC_COUNT} topics, found ${ids.length}`);
  }

  for (const id of ids) {
    if (!HISTORICAL_EVIDENCE_ID_RE.test(id)) {
      violations.push(`topic id '${id}' does not match ${HISTORICAL_EVIDENCE_ID_RE}`);
    }
    const entry = topics[id];
    if (typeof entry?.pattern !== 'string' || entry.pattern.trim().length === 0) {
      violations.push(`${id}: pattern missing or empty`);
    }
    if (typeof entry?.evidence !== 'string' || !HISTORICAL_EVIDENCE_CODE_SET.has(entry.evidence)) {
      violations.push(`${id}: evidence '${String(entry?.evidence)}' is not one of {${HISTORICAL_EVIDENCE_CODES.join(', ')}}`);
    }
  }

  return result('B7 historical-evidence.yml structural validity (116 topics, D/P/S codes)', violations);
}

export function runHistoricalEvidenceChecks(evidence: HistoricalEvidenceFile): CheckResult[] {
  return [checkB7_HistoricalEvidenceValid(evidence)];
}

// ---------------------------------------------------------------------------
// File loading (the only I/O — kept out of the check functions above)
// ---------------------------------------------------------------------------

export class IntentCatalogueParseError extends Error {
  constructor(file: string, cause: unknown) {
    super(`intent catalogue file failed to parse: ${file} — ${(cause as Error)?.message ?? String(cause)}`);
    this.name = 'IntentCatalogueParseError';
  }
}

export function loadCatalogue(filePath: string = CATALOGUE_PATH): AtomicCatalogueFile {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new IntentCatalogueParseError(filePath, err);
  }
  try {
    return JSON.parse(raw) as AtomicCatalogueFile;
  } catch (err) {
    throw new IntentCatalogueParseError(filePath, err);
  }
}

export function loadIntentProfiles(filePath: string = INTENT_PROFILES_PATH): IntentProfilesFile {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new IntentCatalogueParseError(filePath, err);
  }
  try {
    return parseYaml(raw) as IntentProfilesFile;
  } catch (err) {
    throw new IntentCatalogueParseError(filePath, err);
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function printTable(results: CheckResult[]): void {
  const nameWidth = Math.max('check'.length, ...results.map((r) => r.name.length)) + 2;
  const statusWidth = 'status'.length + 2;

  const header = 'check'.padEnd(nameWidth) + 'status'.padEnd(statusWidth) + 'count';
  console.log(header);
  console.log('-'.repeat(header.length + 6));
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(r.name.padEnd(nameWidth) + status.padEnd(statusWidth) + String(r.count));
  }
}

/**
 * The register report behind `--pain-points`.
 *
 * `ProblemStatementBlock` opens every mapped concept page with a module's
 * `primary_pain_point`, so the tone of those strings is read by a student far
 * more often than by anyone editing them. Nobody can judge a register they
 * cannot see in one sitting, and reading 26 rows out of a 203-atom JSON file by
 * hand is exactly the review that does not happen. This prints them in the
 * order a student would meet them.
 *
 * Report-only by construction: it returns a string and runs no checks, so it
 * cannot become a rule about what a pain point is allowed to say. Register is a
 * judgment call — the report exists to inform one, not to automate it.
 *
 * `module` is a parameter rather than a hardcoded 'linear-algebra' so the same
 * pass can be run on the next module without a second, drifting copy of it.
 */
export function renderPainPointReport(atoms: CatalogueAtom[], module = 'linear-algebra'): string {
  const inModule = atoms
    .filter((a) => a.module === module)
    // Page order: `sequence` is the catalogue's own ordering field; atomic_id
    // is the tiebreak so a missing sequence degrades to a stable order rather
    // than an arbitrary one.
    .sort((a, b) => {
      const as = typeof a.sequence === 'number' ? a.sequence : Number.MAX_SAFE_INTEGER;
      const bs = typeof b.sequence === 'number' ? b.sequence : Number.MAX_SAFE_INTEGER;
      return as !== bs ? as - bs : a.atomic_id.localeCompare(b.atomic_id);
    });

  const lines: string[] = [];
  lines.push(`Pain-point register — module '${module}' (${inModule.length} atom(s), page order)`);
  lines.push('');

  if (inModule.length === 0) {
    lines.push(`  (no atoms with module === '${module}' in the catalogue)`);
    lines.push('');
    return lines.join('\n');
  }

  for (const a of inModule) {
    lines.push(`${a.atomic_id}  ${String(a.subtopic ?? '(no subtopic)')}`);
    lines.push(`    ${String(a.primary_pain_point ?? '(no primary_pain_point)')}`);
    lines.push('');
  }

  // The one count worth stating out loud: a pain point repeated across every
  // atom is a module-level generality being rendered as a per-page diagnosis,
  // which is a register finding in itself.
  const distinct = new Set(inModule.map((a) => String(a.primary_pain_point ?? '')));
  lines.push(`${inModule.length} atom(s), ${distinct.size} distinct pain-point string(s).`);
  lines.push('');
  return lines.join('\n');
}

function printViolations(results: CheckResult[]): void {
  for (const r of results) {
    if (r.pass) continue;
    console.log(`\n  ✗ ${r.name} (${r.count} violation${r.count === 1 ? '' : 's'}):`);
    for (const v of r.violations.slice(0, 25)) console.log(`      - ${v}`);
    if (r.violations.length > 25) console.log(`      ... and ${r.violations.length - 25} more`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const reportOnly = process.argv.includes('--report-only');
  const painPoints = process.argv.includes('--pain-points');

  // The register report is additive and terminal: it prints and exits 0 without
  // running a single check, so it can never change what this gate blocks on.
  if (painPoints) {
    let catalogue: AtomicCatalogueFile;
    try {
      catalogue = loadCatalogue();
    } catch (err) {
      if (err instanceof IntentCatalogueParseError) {
        console.error(`[check-intent-catalogue] FATAL — ${err.message}\n`);
        process.exit(1);
        return;
      }
      throw err;
    }
    console.log(`\n${renderPainPointReport(catalogue.atoms ?? [])}`);
    process.exit(0);
    return;
  }

  console.log('\n[check-intent-catalogue] Validating atomic-catalogue.json + intent-profiles.yml + historical-evidence.yml\n');

  let catalogue: AtomicCatalogueFile;
  let profiles: IntentProfilesFile;
  let historicalEvidence: HistoricalEvidenceFile;
  try {
    catalogue = loadCatalogue();
    profiles = loadIntentProfiles();
    historicalEvidence = loadHistoricalEvidence();
  } catch (err) {
    if (err instanceof IntentCatalogueParseError) {
      console.error(`[check-intent-catalogue] FATAL — ${err.message}\n`);
      process.exit(1);
      return;
    }
    throw err;
  }

  const atoms = catalogue.atoms ?? [];
  const concepts: ConceptLike[] = ALL_CONCEPTS.map((c) => ({ id: c.id, prerequisites: c.prerequisites }));
  const catalogueModules = new Set(atoms.map((a) => a.module));

  const results = [
    ...runCatalogueChecks(atoms, concepts),
    ...runIntentProfileChecks(profiles, catalogueModules),
    ...runHistoricalEvidenceChecks(historicalEvidence),
  ];

  printTable(results);

  const failCount = results.filter((r) => !r.pass).length;
  console.log(`\nChecked ${results.length} rules | ${results.length - failCount} pass, ${failCount} fail`);

  if (failCount === 0) {
    console.log('\n✓ Intent catalogue + intent profiles are internally consistent.\n');
    process.exit(0);
    return;
  }

  console.log(`\n${'-'.repeat(60)}`);
  console.log(`VIOLATIONS (${reportOnly ? 'REPORT-ONLY' : 'BLOCKING'})`);
  console.log('-'.repeat(60));
  printViolations(results);
  console.log(`\n${'-'.repeat(60)}`);

  if (reportOnly) {
    console.log(`\n[check-intent-catalogue] ${failCount} check(s) failing — not blocking (--report-only)\n`);
    process.exit(0);
  } else {
    console.error(`\n[check-intent-catalogue] ${failCount} check(s) failing — build FAILED\n`);
    process.exit(1);
  }
}

// Only run when invoked as a CLI. Without this guard, importing the module
// to test its pure functions would execute main() and call process.exit().
if (process.argv[1]?.endsWith('check-intent-catalogue.ts')) {
  main().catch((e) => {
    console.error('[check-intent-catalogue] Fatal error:', e);
    process.exit(1);
  });
}
