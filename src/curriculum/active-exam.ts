/**
 * Active-exam resolution — the one dependency-free layer that both the
 * concept graph and the exam loader can read.
 *
 * WHY THIS FILE EXISTS
 *
 * `exam-loader.ts` imports `constants/concept-graph.ts` (it validates every
 * pack's `concept_ids` against the graph in `checkConceptId`), so
 * concept-graph.ts cannot import exam-loader.ts back without a cycle. Before
 * this module that forced concept-graph.ts to hardcode
 * `data/curriculum/gate-ma.yml` as its one canonical file — and THAT is what
 * made the whole adaptive engine single-exam. Elo, FSRS, readiness /
 * next-best-action, prerequisite repair, FIRe credit propagation, quiz-pool
 * assembly and the frontier spine all read `ALL_CONCEPTS`, and `ALL_CONCEPTS`
 * could only ever be GATE's 101 nodes no matter which exam the deployment
 * said it was serving.
 *
 * This module imports nothing from the app (only `fs`, `path`, `url` and the
 * `yaml` parser), so both sides can depend on it and neither depends on the
 * other.
 *
 * THE ONE POLICY, TWO CANDIDATE SOURCES
 *
 * `pickActiveExamId()` is the single implementation of "given these exam ids,
 * which one is active". It is called with different candidate lists by design,
 * because the two layers legitimately know different things:
 *
 *   - `listExamPackFiles()` here scans DISK. It is what concept-graph.ts must
 *     use, since the graph is built before any pack has been validated.
 *   - `exam-loader.resolveActiveExamId()` passes `listExamIds()`, i.e. packs
 *     that actually PARSED. A pack that fails `loadOne()` is on disk but is
 *     not a usable exam, and the loader is right to exclude it.
 *
 * The policy itself is shared, so the part that could silently drift (which
 * env var wins, what happens with several packs) cannot.
 *
 * PATH RESOLUTION
 *
 * Resolved relative to THIS module rather than `process.cwd()`, matching what
 * concept-graph.ts already did and for the same reason: scripts and tests get
 * spawned with an unrelated cwd, and they should not have to run from the repo
 * root just to import the concept graph.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

export const CURRICULUM_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/curriculum',
);

/**
 * Not every YAML file beside an exam pack IS an exam pack.
 *
 * `<exam>.floor.yml` is the Bare-Minimum Syllabus Contract for that exam —
 * scripts/check-syllabus-floor.ts resolves it by exactly that name. It
 * declares floors, not an exam, so it has no `metadata:` block and never
 * should. Feeding it to the loader made every boot log
 *
 *   [exam-loader] failed gate-ma.floor.yml: metadata block required
 *
 * which is a real error message about a file that is not in fact wrong.
 *
 * Skipping by suffix rather than by "has no metadata block" is deliberate:
 * the metadata error is the loader's only defence against a genuinely
 * malformed exam pack, and swallowing it to quiet this one file would trade a
 * false alarm for a silence that matters.
 *
 * (Moved here from exam-loader.ts, which now re-exports it, so the concept
 * graph can skip sidecars by the same rule instead of a second copy of it.)
 */
export function isExamSidecar(filename: string): boolean {
  return /\.floor\.ya?ml$/.test(filename);
}

export interface ExamPackFile {
  /** `metadata.id` from inside the pack, falling back to the filename stem. */
  id: string;
  filename: string;
  path: string;
}

let _packCache: ExamPackFile[] | null = null;

/**
 * Every exam pack on disk, sorted by id.
 *
 * The id comes from the pack's own `metadata.id` rather than its filename, so
 * this agrees with `exam-loader.loadAllExams()` (which keys its map the same
 * way) even if the two ever disagree on a given file. The filename stem is
 * only a fallback for a pack too malformed to parse — such a file will fail
 * the loader's real validation anyway, and dropping it silently here would
 * hide it from the disk-level view the concept graph needs.
 */
export function listExamPackFiles(forceReload = false): ExamPackFile[] {
  if (_packCache && !forceReload) return _packCache;

  if (!fs.existsSync(CURRICULUM_DIR)) {
    _packCache = [];
    return _packCache;
  }

  const packs: ExamPackFile[] = [];
  for (const filename of fs.readdirSync(CURRICULUM_DIR)) {
    if (!filename.endsWith('.yml') && !filename.endsWith('.yaml')) continue;
    if (isExamSidecar(filename)) continue;

    const full = path.join(CURRICULUM_DIR, filename);
    let id = filename.replace(/\.ya?ml$/, '');
    try {
      const raw = parseYaml(fs.readFileSync(full, 'utf-8'));
      const declared = raw?.metadata?.id;
      if (typeof declared === 'string' && declared.length > 0) id = declared;
    } catch {
      // Unparseable: keep the filename-derived id so the file stays visible.
      // exam-loader.loadOne() is what reports the parse error properly.
    }
    packs.push({ id, filename, path: full });
  }

  packs.sort((a, b) => a.id.localeCompare(b.id));
  _packCache = packs;
  return _packCache;
}

/**
 * Which exam is active, given the ids a caller considers available.
 *
 * 1. `DEFAULT_EXAM_ID` when it names one of them — the operator's explicit
 *    choice, set per deployment (declared in render.yaml as `sync: false`).
 * 2. Otherwise the first id in sorted order.
 *
 * Step 2 is deliberately SORTED rather than "whatever the filesystem listed
 * first", which is what this resolution used to be. Directory order is
 * arbitrary, so with more than one pack installed and no `DEFAULT_EXAM_ID`
 * set, the deployment's active exam could differ between two machines running
 * identical code. Sorting makes the fallback reproducible. It is still only a
 * fallback: a deployment serving one exam out of several should name it
 * explicitly rather than rely on alphabetical order.
 */
export function pickActiveExamId(availableIds: string[]): string | null {
  if (availableIds.length === 0) return null;
  const envExamId = (process.env.DEFAULT_EXAM_ID || '').trim();
  if (envExamId && availableIds.includes(envExamId)) return envExamId;
  return [...availableIds].sort()[0];
}

/** The active exam's pack file on disk, or null when `data/curriculum/` is empty. */
export function resolveActiveExamPack(forceReload = false): ExamPackFile | null {
  const packs = listExamPackFiles(forceReload);
  const activeId = pickActiveExamId(packs.map((p) => p.id));
  if (!activeId) return null;
  return packs.find((p) => p.id === activeId) ?? null;
}

/** Test seam — drops the disk scan cache. */
export function __resetExamPackCache(): void {
  _packCache = null;
}
