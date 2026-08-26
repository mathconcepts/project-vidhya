// @ts-nocheck
/**
 * Exam Loader
 *
 * Loads exam definitions from data/curriculum/*.yml, validates structure,
 * and surfaces them as ExamDefinition objects. Cached per-process so
 * repeated lookups are free.
 *
 * Pure function of the filesystem — no DB, no network. Admins change exam
 * definitions by editing YAML files and rebuilding the bundle.
 *
 * Phase 1 of Curriculum R&D (PR #31) added the `exam_packs` table for
 * operator-defined packs that live in the DB alongside YAML packs. The
 * loader does NOT merge those rows yet — that wires in PR #32 once the
 * unit generator needs to read them. For now the table is populated by
 * /api/admin/exam-packs but consumed only by the admin UI's pack picker.
 * Keeping the merge out of Phase 1 preserves the existing-behavior risk
 * floor: every caller of `getExam()` continues to see exactly the same
 * data it did pre-PR-#31.
 */

import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { ALL_CONCEPTS, CONCEPT_MAP, type ConceptNode } from '../constants/concept-graph';
import type {
  ExamDefinition,
  ExamMetadata,
  SyllabusSection,
  ConceptExamLink,
  CurriculumScope,
  ConceptDepth,
} from './types';

const CURRICULUM_DIR = path.resolve(process.cwd(), 'data/curriculum');
const VALID_SCOPES: CurriculumScope[] = [
  'mcq-fast', 'mcq-rigorous', 'mcq-and-numerical', 'subjective-short', 'subjective-long', 'oral-viva', 'practical',
];
const VALID_DEPTHS: ConceptDepth[] = ['introductory', 'standard', 'advanced'];

let _cache: Map<string, ExamDefinition> | null = null;

// ============================================================================
// Validation helpers — strict but error-tolerant (partial exam defs still work)
// ============================================================================

function validateMetadata(raw: any, filepath: string): ExamMetadata {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${filepath}: metadata block required`);
  }
  if (typeof raw.id !== 'string' || !/^[a-z0-9-]+$/.test(raw.id)) {
    throw new Error(`${filepath}: metadata.id must be kebab-case string`);
  }
  if (typeof raw.name !== 'string' || raw.name.length === 0) {
    throw new Error(`${filepath}: metadata.name required`);
  }
  if (!VALID_SCOPES.includes(raw.scope)) {
    throw new Error(`${filepath}: metadata.scope must be one of ${VALID_SCOPES.join(', ')}`);
  }
  return {
    id: raw.id,
    name: raw.name,
    conducting_body: raw.conducting_body || 'unknown',
    year_effective_from: typeof raw.year_effective_from === 'number' ? raw.year_effective_from : undefined,
    syllabus_source_url: raw.syllabus_source_url,
    description: raw.description,
    scope: raw.scope,
    total_marks: raw.total_marks,
    duration_minutes: raw.duration_minutes,
    language: raw.language || 'en',
  };
}

/**
 * Stub-exam rule (CEO plan §6 baseline): a concept_id referenced anywhere in
 * an exam YAML is either (a) a real concept-graph node, (b) an explicitly
 * declared stub (listed in the file's top-level `stub_concepts:`), or (c) a
 * hard validation failure. There is no fourth path where an unrecognized id
 * gets silently dropped behind a console.warn that scrolls by in server
 * logs — a Phase-1 exam stub like jee-main.yml declares its placeholder ids
 * up front instead.
 *
 * Exported for unit testing — pure, no side effects.
 */
export function checkConceptId(cid: string, path_: string, knownConcepts: Set<string>, declaredStubs: Set<string>): void {
  if (knownConcepts.has(cid) || declaredStubs.has(cid)) return;
  throw new Error(
    `${path_}: concept_id "${cid}" is neither a known concept-graph node nor declared in ` +
    `this file's stub_concepts: list. Either link it into the concept graph (` +
    `data/curriculum/gate-ma.yml's concepts: section) or add it to stub_concepts: to ` +
    `acknowledge it's a placeholder — an unrecognized concept_id is a hard failure, not a warning.`,
  );
}

function validateSyllabusSection(
  raw: any,
  path_: string,
  knownConcepts: Set<string>,
  declaredStubs: Set<string>,
): SyllabusSection {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${path_}: expected object`);
  }
  const id = typeof raw.id === 'string' ? raw.id : null;
  const title = typeof raw.title === 'string' ? raw.title : null;
  if (!id || !title) {
    throw new Error(`${path_}: section requires id + title`);
  }
  const weight = Number(raw.weight_pct);
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
    throw new Error(`${path_}.weight_pct must be 0-100`);
  }
  const concept_ids: string[] = Array.isArray(raw.concept_ids)
    ? raw.concept_ids.filter((c: any) => typeof c === 'string')
    : [];
  for (const cid of concept_ids) {
    checkConceptId(cid, `${path_}.concept_ids`, knownConcepts, declaredStubs);
  }
  const stub_concept_ids = concept_ids.filter(c => declaredStubs.has(c) && !knownConcepts.has(c));
  const sub: SyllabusSection[] = Array.isArray(raw.sub_sections)
    ? raw.sub_sections.map((s: any, i: number) =>
        validateSyllabusSection(s, `${path_}.sub_sections[${i}]`, knownConcepts, declaredStubs))
    : [];
  return {
    id,
    title,
    weight_pct: weight,
    description: raw.description,
    sub_sections: sub.length > 0 ? sub : undefined,
    concept_ids,
    stub_concept_ids: stub_concept_ids.length > 0 ? stub_concept_ids : undefined,
  };
}

function validateConceptLink(
  raw: any,
  i: number,
  knownConcepts: Set<string>,
  declaredStubs: Set<string>,
): ConceptExamLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const cid = typeof raw.concept_id === 'string' ? raw.concept_id : null;
  if (!cid) {
    throw new Error(`concept_links[${i}]: missing concept_id`);
  }
  checkConceptId(cid, `concept_links[${i}]`, knownConcepts, declaredStubs);
  const depth: ConceptDepth = VALID_DEPTHS.includes(raw.depth) ? raw.depth : 'standard';
  const weight = Number(raw.weight);
  return {
    concept_id: cid,
    depth,
    weight: Number.isFinite(weight) && weight >= 0 && weight <= 1 ? weight : 0.05,
    emphasis: Array.isArray(raw.emphasis) ? raw.emphasis.filter((s: any) => typeof s === 'string') : [],
    restrictions: Array.isArray(raw.restrictions) ? raw.restrictions.filter((s: any) => typeof s === 'string') : [],
    curator_note: raw.curator_note,
  };
}

function collectStubIds(sections: SyllabusSection[], out: Set<string>): void {
  for (const s of sections) {
    for (const cid of s.stub_concept_ids ?? []) out.add(cid);
    if (s.sub_sections?.length) collectStubIds(s.sub_sections, out);
  }
}

// ============================================================================
// Load + parse one YAML file
// ============================================================================

function loadOne(filepath: string): ExamDefinition {
  const raw = parseYaml(fs.readFileSync(filepath, 'utf-8'));
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${filepath}: empty or malformed YAML`);
  }
  const knownConcepts = new Set(ALL_CONCEPTS.map(c => c.id));
  const declaredStubs: Set<string> = new Set(
    Array.isArray(raw.stub_concepts) ? raw.stub_concepts.filter((c: any) => typeof c === 'string') : [],
  );
  const metadata = validateMetadata(raw.metadata, filepath);
  const syllabus = Array.isArray(raw.syllabus)
    ? raw.syllabus.map((s: any, i: number) =>
        validateSyllabusSection(s, `syllabus[${i}]`, knownConcepts, declaredStubs))
    : [];
  const concept_links = Array.isArray(raw.concept_links)
    ? raw.concept_links
        .map((l: any, i: number) => validateConceptLink(l, i, knownConcepts, declaredStubs))
        .filter(Boolean) as ConceptExamLink[]
    : [];
  const stub_concept_ids = new Set<string>();
  collectStubIds(syllabus, stub_concept_ids);
  for (const link of concept_links) {
    if (declaredStubs.has(link.concept_id) && !knownConcepts.has(link.concept_id)) {
      stub_concept_ids.add(link.concept_id);
    }
  }
  return { metadata, syllabus, concept_links, stub_concept_ids: Array.from(stub_concept_ids).sort() };
}

// ============================================================================
// Public API
// ============================================================================

export function loadAllExams(forceReload = false): Map<string, ExamDefinition> {
  if (_cache && !forceReload) return _cache;
  const cache = new Map<string, ExamDefinition>();

  if (!fs.existsSync(CURRICULUM_DIR)) {
    _cache = cache;
    return cache;
  }

  const files = fs
    .readdirSync(CURRICULUM_DIR)
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .filter(f => !isExamSidecar(f));
  for (const f of files) {
    try {
      const def = loadOne(path.join(CURRICULUM_DIR, f));
      cache.set(def.metadata.id, def);
    } catch (err) {
      console.error(`[exam-loader] failed ${f}:`, (err as Error).message);
    }
  }

  _cache = cache;
  return cache;
}

/**
 * Not every YAML file beside an exam pack IS an exam pack.
 *
 * `<exam>.floor.yml` is the Bare-Minimum Syllabus Contract for that exam —
 * scripts/check-syllabus-floor.ts resolves it by exactly that name. It
 * declares floors, not an exam, so it has no `metadata:` block and never
 * should. Feeding it to loadOne() made every boot log
 *
 *   [exam-loader] failed gate-ma.floor.yml: metadata block required
 *
 * which is a real error message about a file that is not in fact wrong.
 *
 * Skipping by suffix rather than by "has no metadata block" is deliberate:
 * the metadata error is the loader's only defence against a genuinely
 * malformed exam pack, and swallowing it to quiet this one file would trade a
 * false alarm for a silence that matters.
 */
export function isExamSidecar(filename: string): boolean {
  return /\.floor\.ya?ml$/.test(filename);
}

export function getExam(exam_id: string): ExamDefinition | null {
  return loadAllExams().get(exam_id) || null;
}

export function listExamIds(): string[] {
  return Array.from(loadAllExams().keys()).sort();
}

// ============================================================================
// Generation scope — resolves an exam's syllabus into actual concept-graph
// nodes for the content-generation job (formerly src/jobs/generation-syllabi.ts;
// relocated here per that file's own docblock once this migration — concept-graph.ts
// becoming a thin loader over data/curriculum/gate-ma.yml — landed, so the job
// no longer needs a separate narrow adapter: it reads the unified registry
// directly. CEO plan §6 baseline / Loop A.)
// ============================================================================

export interface GenerationSyllabus {
  id: string;
  name: string;
  /** Concepts resolvable in the concept graph — the actual generation scope. */
  concepts: ConceptNode[];
  /** concept_ids this exam's YAML declares that the concept graph doesn't have a node for yet
   *  (includes declared stubs — see the stub-exam rule above). */
  unresolvedConceptIds: string[];
  /** '' = gate-ma's existing unprefixed atom layout; else nested under this id. */
  atomsSubdir: string;
}

/** @deprecated kept as an alias — prefer {@link GenerationSyllabus}. */
export type Syllabus = GenerationSyllabus;

export const DEFAULT_SYLLABUS_ID = 'gate-ma';

function flattenConceptIds(sections: SyllabusSection[]): string[] {
  const ids: string[] = [];
  for (const s of sections) {
    ids.push(...s.concept_ids);
    if (s.sub_sections?.length) ids.push(...flattenConceptIds(s.sub_sections));
  }
  return ids;
}

/** Registered syllabus ids — every data/curriculum/*.yml file, auto-discovered. Alias of listExamIds(). */
export function listSyllabusIds(): string[] {
  return listExamIds();
}

/**
 * Resolves an exam's generation scope: which concept-graph nodes the
 * content-generation job should iterate for this exam.
 *
 * Scope rule (why gate-ma is special-cased):
 *   - The concept graph (data/curriculum/gate-ma.yml's `concepts:` section,
 *     loaded via src/constants/concept-graph.ts) is GATE-only (82 concepts)
 *     and IS the authoritative concept universe for GATE. gate-ma.yml's
 *     `syllabus:` concept_ids are an intentionally partial, in-progress
 *     curation (27/82 today) used for weight/depth/emphasis metadata (the
 *     Lesson composer's filtering), not a generation scope. Trusting the
 *     syllabus for gate-ma would silently drop 55 concepts from generation
 *     — a regression versus current behavior. So gate-ma keeps the full graph.
 *   - Every OTHER exam has no such native mapping in the concept graph, so
 *     its generation scope is exactly what data/curriculum/<exam>.yml
 *     declares, intersected with whatever concepts already exist in the
 *     shared graph. For a Phase-1 stub like jee-main (concept_ids declared
 *     via stub_concepts:, not yet real nodes) that intersection is
 *     legitimately empty today; contentGenerationJob's preflight refuses
 *     with an honest message instead of silently generating nothing.
 *   - Onboarding real content generation for a new exam: (1) write
 *     data/curriculum/<exam-id>.yml, (2) link its concept_ids into the
 *     concept graph (data/curriculum/gate-ma.yml's concepts: section, one
 *     entry each with real prerequisites — or a future per-exam concepts
 *     file, once a second exam earns its own canonical graph).
 */
export function getSyllabus(id: string = DEFAULT_SYLLABUS_ID): GenerationSyllabus {
  const exam = getExam(id);
  if (!exam) {
    throw new Error(`unknown syllabus "${id}" — registered: ${listSyllabusIds().join(', ')}`);
  }

  if (id === DEFAULT_SYLLABUS_ID) {
    // gate-ma: the concept graph is the full, authoritative scope (see docblock above).
    return {
      id,
      name: exam.metadata.name,
      concepts: ALL_CONCEPTS,
      unresolvedConceptIds: [],
      atomsSubdir: '',
    };
  }

  const declaredIds = Array.from(new Set(flattenConceptIds(exam.syllabus)));
  const concepts: ConceptNode[] = [];
  const unresolvedConceptIds: string[] = [];
  for (const cid of declaredIds) {
    const node = CONCEPT_MAP.get(cid);
    if (node) concepts.push(node);
    else unresolvedConceptIds.push(cid);
  }

  return {
    id,
    name: exam.metadata.name,
    concepts,
    unresolvedConceptIds,
    atomsSubdir: id,
  };
}

/**
 * Resolves the deployment's single "active" YAML curriculum exam — the
 * same identity GET /api/exam/active (src/api/curriculum-routes.ts) reports
 * to the frontend's useActiveExam() hook.
 *
 * Resolution order (admin-configurable):
 *   1. process.env.DEFAULT_EXAM_ID — operator picks via the Render
 *      dashboard (env var declared in render.yaml as sync:false) — only
 *      honoured if that id is actually loaded from data/curriculum/.
 *   2. First entry from listExamIds() (alphabetical) — the deployment's
 *      implicit default when no operator override is set.
 *
 * Returns null when data/curriculum/ has no exams loaded at all.
 *
 * IMPORTANT — do not confuse this with src/exams/default-exam.ts's
 * resolveDefaultExamId(). That resolves an *admin-defined Exam record*
 * (ids like 'EXM-UGEE-MATH-SAMPLE', stored in .data/exams.json via
 * src/exams/exam-store.ts) for marketing/content-flywheel purposes. This
 * function resolves a *YAML curriculum exam* (ids like 'gate-ma',
 * 'jee-main', loaded from data/curriculum/*.yml) for anything that needs
 * topics/syllabus/concepts — gate-routes, spine-routes, topic-pages,
 * blog-index, topic-detection, and this module's own /api/exam/active.
 * The two registries are unrelated; passing one's id into the other's
 * lookup silently returns nothing.
 */
export function resolveActiveExamId(): string | null {
  const ids = listExamIds();
  if (ids.length === 0) return null;
  const envExamId = (process.env.DEFAULT_EXAM_ID || '').trim();
  return envExamId && ids.includes(envExamId) ? envExamId : ids[0];
}

/**
 * Total concept-link weight for an exam — used by gap analyzer for
 * priority scoring.
 */
export function totalLinkedWeight(exam_id: string): number {
  const exam = getExam(exam_id);
  if (!exam) return 0;
  return exam.concept_links.reduce((s, l) => s + l.weight, 0);
}

// ============================================================================
// DB-pack merge (Curriculum R&D Phase 2, PR #32)
// ============================================================================
//
// PR #31 introduced the `exam_packs` table for operator-defined packs.
// PR #32 wires the consumer side: the unit generator and admin pack picker
// need a unified view across YAML packs and DB packs.
//
// Design:
//   - The sync `loadAllExams()` / `getExam()` API stays YAML-only and
//     remains the safe default for legacy callers (they never block on a
//     DB roundtrip and never see operator packs).
//   - The async `loadAllExamsWithDb()` / `getExamWithDb()` API merges
//     YAML + DB. New callers (curriculum-unit-orchestrator, the unit
//     generator) opt in by using the async variants.
//   - Conflicts are resolved YAML-wins. A row in `exam_packs` whose id
//     duplicates a YAML pack is treated as inert (logged + skipped) so
//     operators can't override canonical packs by accident.
//
// Cache: short-lived (60 seconds). Rebuilds the merged map on demand;
// keeps DB load low while still surfacing newly-created operator packs
// within a minute.

import pg from 'pg';

let _mergedCache: { map: Map<string, ExamDefinition>; expires_at: number } | null = null;
const MERGE_TTL_MS = 60_000;
let _dbPool: pg.Pool | null = null;

function getMergePool(): pg.Pool | null {
  if (_dbPool) return _dbPool;
  if (!process.env.DATABASE_URL) return null;
  _dbPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _dbPool;
}

interface ExamPackDbRow {
  id: string;
  name: string;
  source: 'yaml' | 'operator';
  config: any;
  interactives_enabled: boolean;
  status: 'active' | 'archived';
}

/**
 * Convert a DB exam_packs row into the same `ExamDefinition` shape that
 * the YAML loader produces. Best-effort: missing fields fall back to
 * sensible defaults so a half-filled operator pack still loads.
 */
function dbPackToDefinition(row: ExamPackDbRow): ExamDefinition | null {
  const config = (row.config && typeof row.config === 'object') ? row.config : {};
  const metadataRaw = (config.metadata && typeof config.metadata === 'object') ? config.metadata : {};
  const syllabusRaw = Array.isArray(config.syllabus) ? config.syllabus : [];

  const metadata: ExamMetadata = {
    id: row.id,
    name: row.name,
    description: typeof metadataRaw.description === 'string' ? metadataRaw.description : '',
    conducting_body: typeof metadataRaw.conducting_body === 'string' ? metadataRaw.conducting_body : 'Operator-defined',
    scope: (metadataRaw.scope as CurriculumScope) ?? 'mcq-rigorous',
    total_marks: typeof metadataRaw.total_marks === 'number' ? metadataRaw.total_marks : 0,
    duration_minutes: typeof metadataRaw.duration_minutes === 'number' ? metadataRaw.duration_minutes : 0,
    language: typeof metadataRaw.language === 'string' ? metadataRaw.language : 'en',
    year_effective_from: typeof metadataRaw.year_effective_from === 'number' ? metadataRaw.year_effective_from : new Date().getFullYear(),
  };

  const syllabus: SyllabusSection[] = [];
  for (const s of syllabusRaw) {
    if (!s || typeof s !== 'object') continue;
    const id = typeof s.id === 'string' ? s.id : null;
    if (!id) continue;
    syllabus.push({
      id,
      title: typeof s.title === 'string' ? s.title : id,
      weight_pct: typeof s.weight_pct === 'number' ? s.weight_pct : 0,
      description: typeof s.description === 'string' ? s.description : undefined,
      concept_ids: Array.isArray(s.concept_ids) ? s.concept_ids.filter((c: any) => typeof c === 'string') : [],
    });
  }

  return {
    metadata,
    syllabus,
    concept_links: [], // operator packs don't seed concept_links yet — they grow via the unit generator
    stub_concept_ids: [], // operator packs don't declare stubs via YAML — N/A until they seed concept_links
  };
}

/**
 * Async: merged view across YAML packs and DB-sourced operator packs.
 * Cached for ~60s; force a rebuild via the second arg.
 */
export async function loadAllExamsWithDb(forceReload = false): Promise<Map<string, ExamDefinition>> {
  const now = Date.now();
  if (!forceReload && _mergedCache && _mergedCache.expires_at > now) {
    return _mergedCache.map;
  }

  // Start with the YAML view (sync, fast)
  const merged = new Map<string, ExamDefinition>(loadAllExams(forceReload));

  const pool = getMergePool();
  if (pool) {
    try {
      const { rows } = await pool.query<ExamPackDbRow>(
        `SELECT id, name, source, config, interactives_enabled, status
           FROM exam_packs
          WHERE source = 'operator' AND status = 'active'`,
      );
      for (const row of rows) {
        if (merged.has(row.id)) {
          // YAML wins — operator pack with a duplicate id is inert (defensive).
          // Reserved-slug check at /api/admin/exam-packs catches this on create,
          // so this branch is for the "race" case (someone migrates a YAML pack
          // and forgets to archive the DB row).
          console.warn(`[exam-loader] DB pack '${row.id}' shadowed by YAML; skipping`);
          continue;
        }
        const def = dbPackToDefinition(row);
        if (def) merged.set(row.id, def);
      }
    } catch (err) {
      // DB unreachable shouldn't crash callers — log + return YAML-only view.
      console.error('[exam-loader] DB merge failed; YAML-only view returned:', (err as Error).message);
    }
  }

  _mergedCache = { map: merged, expires_at: now + MERGE_TTL_MS };
  return merged;
}

/**
 * Async sibling of `getExam(id)` — sees both YAML and DB packs.
 * Returns null when the exam doesn't exist anywhere.
 */
export async function getExamWithDb(exam_id: string): Promise<ExamDefinition | null> {
  const m = await loadAllExamsWithDb();
  return m.get(exam_id) ?? null;
}

/** Test-only: clear merged cache. */
export function __resetMergedCache(): void {
  _mergedCache = null;
}
