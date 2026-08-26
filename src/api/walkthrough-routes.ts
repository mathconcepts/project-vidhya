/**
 * src/api/walkthrough-routes.ts — the per-concept student walkthrough.
 *
 *   GET /api/lesson/walkthrough/:concept_id
 *
 * Four legs — Explanation → Interactive → Practice → Test — each reported
 * as { available, ...count } so the frontend rail (LessonPage) can render
 * an honest state per leg instead of guessing or hiding a broken link.
 * Counts only, no per-student data, matching the surveillance discipline
 * every other admin/lesson route in this file's neighborhood follows.
 *
 * ── Leg sourcing ─────────────────────────────────────────────────────
 *
 *   explanation / interactive — the same atom loader the lesson-compose
 *     path already uses (src/content/atom-loader.ts). `interactive` reuses
 *     `widgetKindOf()` from admin-walkthrough-routes.ts (the existing
 *     ```interactive-spec``` detector) rather than re-implementing the
 *     fenced-block parse a second time.
 *
 *   practice — src/scoring/learning-object-catalog-pg.ts's
 *     `getLearningObjectCatalog()` (DB-less safe: falls back to the file
 *     catalog when DATABASE_URL is unset), filtered to items
 *     `gateItemFromPayload()` reports as actually gradable — an item with
 *     no marking authored yet is honestly not counted as a practice leg,
 *     mirroring quiz-routes.ts's renderSafeItem gradability check.
 *
 *   test — exam-style (PYQ) question count for the concept, read defensively
 *     from the PYQ bundle (frontend/public/data/content-bundle.json, falling
 *     back to pyq-bank.json): prefer a `concept_ids` array on a bundle
 *     problem, fall back to a scalar `concept_id`, and if NEITHER field is
 *     present anywhere in the bundle, report `available:false,
 *     question_count:0` rather than guessing from the coarse `topic` string
 *     (a topic match would silently claim every linear-algebra PYQ "covers"
 *     every one of the 26 concepts, which is false). This is deliberately
 *     defensive because the concept-tagging field is a SIBLING LANE'S
 *     artifact (owned by `scripts/export-bundles.ts` / `data/**`, out of
 *     this task's scope) — as of writing, `frontend/public/data/
 *     content-bundle.json`'s 249 problems already carry a scalar
 *     `concept_id`, so the fallback branch is exercised in production
 *     today, not just in tests. No code here needs to change if that lane
 *     later moves to the richer `concept_ids` array — `countTestQuestions()`
 *     already prefers it.
 */

import fs from 'fs';
import path from 'path';
import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';
import { CONCEPT_MAP } from '../constants/concept-graph';
import { loadConceptAtoms, ConceptNotFoundError } from '../content/atom-loader';
import { widgetKindOf } from './admin-walkthrough-routes';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { gateItemFromPayload } from './practice-routes';

interface RouteDefinition { method: string; path: string; handler: RouteHandler }

export interface WalkthroughLegs {
  explanation: { available: boolean; atom_count: number };
  interactive: { available: boolean; count: number };
  practice: { available: boolean; item_count: number; first_object_id: string | null };
  /**
   * `exam_tested` mirrors `ConceptNode.exam_tested` (concept-graph.ts):
   * `false` means this concept is a prerequisite exams assume rather than
   * directly test, so `available:false` here is a correct, permanent
   * property of the concept — not a content gap. `available` itself stays
   * strictly evidence-based (real mapped questions only, unaffected by the
   * flag) so nothing downstream that gates on it — e.g. the checkpoint
   * quiz CTA — is silently unlocked by an exemption that was never about
   * quiz readiness.
   */
  test: { available: boolean; question_count: number; exam_tested: boolean };
}

export interface WalkthroughResponse {
  concept_id: string;
  label: string;
  legs: WalkthroughLegs;
}

// ────────────────────────────────────────────────────────────────────
// Test-leg count: PYQ bundle, read defensively (see file header)
// ────────────────────────────────────────────────────────────────────

interface BundleProblem {
  concept_id?: unknown;
  concept_ids?: unknown;
  [key: string]: unknown;
}

let _cachedBundleProblems: BundleProblem[] | null = null;

/** Same candidate-path search order as src/content/resolver.ts's loadBundle(). */
function loadPyqBundleProblems(): BundleProblem[] {
  if (_cachedBundleProblems) return _cachedBundleProblems;

  const bundleCandidates = [
    path.resolve(process.cwd(), 'frontend/dist/data/content-bundle.json'),
    path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json'),
    path.resolve(process.cwd(), '../frontend/public/data/content-bundle.json'),
    path.resolve(process.cwd(), 'public/data/content-bundle.json'),
  ];
  for (const p of bundleCandidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (Array.isArray(parsed?.problems)) {
        _cachedBundleProblems = parsed.problems as BundleProblem[];
        return _cachedBundleProblems;
      }
    } catch {
      // fall through to the next candidate / the legacy fallback below
    }
  }

  // Legacy fallback (mirrors resolver.ts's assembleFromLegacyBundles): the
  // raw PYQ bank when the assembled content-bundle.json isn't present.
  const pyqPath = path.resolve(process.cwd(), 'frontend/public/data/pyq-bank.json');
  if (fs.existsSync(pyqPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
      if (Array.isArray(parsed?.problems)) {
        _cachedBundleProblems = parsed.problems as BundleProblem[];
        return _cachedBundleProblems;
      }
    } catch {
      // no PYQ source available — empty is the honest answer
    }
  }

  _cachedBundleProblems = [];
  return _cachedBundleProblems;
}

/** Test-only cache reset — mirrors resolver.ts's reloadBundle(). Forces the next read from disk. */
export function __resetWalkthroughBundleCacheForTests(): void {
  _cachedBundleProblems = null;
}

/**
 * Test-only direct injection — bypasses the disk read entirely so tests can
 * pin an exact bundle shape (with `concept_ids`, with `concept_id`, or
 * neither) instead of depending on what's actually committed to
 * frontend/public/data today. Pass null to fall back to the disk read again.
 */
export function __setWalkthroughBundleForTests(problems: BundleProblem[] | null): void {
  _cachedBundleProblems = problems;
}

/**
 * Test-leg count for one concept, read defensively (see file header for the
 * `concept_ids` / `concept_id` / neither contract). Exported for tests and
 * for the sibling lane wiring the real helper to diff against.
 */
export function countTestQuestions(concept_id: string): { available: boolean; question_count: number } {
  const problems = loadPyqBundleProblems();
  let sawConceptField = false;
  let count = 0;
  for (const p of problems) {
    if (Array.isArray(p.concept_ids)) {
      sawConceptField = true;
      if ((p.concept_ids as unknown[]).includes(concept_id)) count++;
    } else if (typeof p.concept_id === 'string') {
      sawConceptField = true;
      if (p.concept_id === concept_id) count++;
    }
  }
  if (!sawConceptField) return { available: false, question_count: 0 };
  return { available: count > 0, question_count: count };
}

// ────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────

const PRACTICE_QUERY_LIMIT = 200;

async function handleWalkthrough(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const concept_id = req.params.concept_id;
  if (!concept_id) return sendError(res, 400, 'concept_id is required');

  const concept = CONCEPT_MAP.get(concept_id);
  if (!concept) return sendError(res, 404, `unknown concept: ${concept_id}`);

  // Explanation + interactive legs.
  let atomCount = 0;
  let interactiveCount = 0;
  try {
    const atoms = await loadConceptAtoms(concept_id);
    atomCount = atoms.length;
    interactiveCount = atoms.filter((a) => widgetKindOf(a.content) !== null).length;
  } catch (err) {
    if (!(err instanceof ConceptNotFoundError)) {
      console.error(`[walkthrough] atom load failed for ${concept_id}:`, (err as Error).message);
    }
    // ConceptNotFoundError just means "no atoms/ and no explainer.md
    // authored yet" — an honest zero, not a route failure. The concept
    // itself is real (it resolved via CONCEPT_MAP above).
  }

  // Practice leg: gradable catalog items only.
  let practiceItemCount = 0;
  let firstObjectId: string | null = null;
  try {
    const catalog = getLearningObjectCatalog();
    const items = await catalog.query({ skillId: concept_id, limit: PRACTICE_QUERY_LIMIT });
    for (const item of items) {
      const itemOrReason = gateItemFromPayload(item.id, item.payload);
      if (typeof itemOrReason !== 'string') {
        practiceItemCount++;
        if (!firstObjectId) firstObjectId = item.id;
      }
    }
  } catch (err) {
    console.error(`[walkthrough] catalog query failed for ${concept_id}:`, (err as Error).message);
  }

  const test = countTestQuestions(concept_id);
  // Default-true, same "absent ⇒ tested" contract as ConceptNode.exam_tested
  // itself — only an explicit `false` in gate-ma.yml flips this.
  const examTested = concept.exam_tested !== false;

  const body: WalkthroughResponse = {
    concept_id,
    label: concept.label,
    legs: {
      explanation: { available: atomCount > 0, atom_count: atomCount },
      interactive: { available: interactiveCount > 0, count: interactiveCount },
      practice: { available: practiceItemCount > 0, item_count: practiceItemCount, first_object_id: firstObjectId },
      test: { ...test, exam_tested: examTested },
    },
  };
  return sendJSON(res, body);
}

export const walkthroughRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/lesson/walkthrough/:concept_id', handler: handleWalkthrough },
];
