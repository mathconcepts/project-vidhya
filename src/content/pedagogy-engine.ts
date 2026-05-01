/**
 * PedagogyEngine — synchronous selector for lesson composition.
 *
 * Picks and orders ContentAtom[] for a given concept based on the student's
 * mastery tier, applies exam overlays, error-streak modality switching, and
 * exam-countdown reordering. Called by lesson-routes.ts after atom-loader
 * loads the concept's atoms.
 *
 * Entirely separate from PedagogyReviewer in src/content/pedagogy.ts —
 * PedagogyReviewer is an async quality gate for generated content; this is
 * a sync selector for composition. No inheritance, no shared base class.
 *
 * Pure: no DB reads, no I/O. Engagement enrichment happens in lesson-routes.ts
 * AFTER selectAtoms() returns.
 */

import type {
  ContentAtom,
  AtomType,
  SessionContext,
  RouteRequest,
} from './content-types';
import type { ConceptMeta, ExamOverlay } from '../curriculum/types';
import type { StudentModel } from '../gbrain/student-model';

// ─── Mastery tier classification ────────────────────────────────────────

export type MasteryTier = 'cold' | 'building' | 'solidifying' | 'exam-ready';

/**
 * Read mastery for a concept from the existing StudentModel shape:
 * `mastery_vector: Record<concept_id, MasteryEntry>` where MasteryEntry has
 * `score: number` (0.0–1.0). Returns 0 if absent.
 */
export function readMasteryScore(model: StudentModel | null, concept_id: string): number {
  if (!model || !model.mastery_vector) return 0;
  const entry = model.mastery_vector[concept_id];
  if (!entry) return 0;
  // MasteryEntry.score (preferred) or bare number for compatibility
  return typeof entry === 'number' ? entry : (entry.score ?? 0);
}

export function classifyMastery(score: number): MasteryTier {
  if (score < 0.3) return 'cold';
  if (score < 0.6) return 'building';
  if (score < 0.8) return 'solidifying';
  return 'exam-ready';
}

// ─── Default atom-type ordering per mastery tier ────────────────────────

const TIER_ORDER: Record<MasteryTier, AtomType[]> = {
  'cold': ['hook', 'intuition', 'visual_analogy', 'micro_exercise', 'retrieval_prompt'],
  'building': ['formal_definition', 'worked_example', 'micro_exercise', 'retrieval_prompt'],
  'solidifying': ['common_traps', 'interleaved_drill', 'retrieval_prompt'],
  'exam-ready': ['retrieval_prompt', 'exam_pattern', 'mnemonic'],
};

const COUNTDOWN_ORDER: AtomType[] = [
  'exam_pattern',
  'common_traps',
  'retrieval_prompt',
  'micro_exercise',
];

const ERROR_STREAK_FALLBACK_CHAIN: AtomType[] = [
  'visual_analogy',
  'mnemonic',
  'worked_example',
];

// ─── Helpers ────────────────────────────────────────────────────────────

function passesExamOverlay(
  atom: ContentAtom,
  overlay: ExamOverlay | undefined,
): boolean {
  if (!overlay) return true;
  // Wildcard atoms bypass skip_atom_types but still respect required_bloom_levels.
  const isWildcard = atom.exam_ids.includes('*');
  if (!isWildcard && overlay.skip_atom_types?.includes(atom.atom_type)) return false;
  if (overlay.required_bloom_levels?.length) {
    if (!overlay.required_bloom_levels.includes(atom.bloom_level)) return false;
  }
  return true;
}

function passesExamFilter(atom: ContentAtom, preferred_exam_id: string | null): boolean {
  if (atom.exam_ids.includes('*')) return true;
  if (!preferred_exam_id) return true; // no filter when no exam specified
  return atom.exam_ids.includes(preferred_exam_id);
}

function orderByTypeList(atoms: ContentAtom[], typeOrder: AtomType[]): ContentAtom[] {
  const buckets = new Map<AtomType, ContentAtom[]>();
  typeOrder.forEach((t) => buckets.set(t, []));
  const leftover: ContentAtom[] = [];
  for (const a of atoms) {
    const bucket = buckets.get(a.atom_type);
    if (bucket) bucket.push(a);
    else leftover.push(a);
  }
  const ordered: ContentAtom[] = [];
  for (const t of typeOrder) ordered.push(...(buckets.get(t) ?? []));
  ordered.push(...leftover);
  return ordered;
}

// ─── Main selector ──────────────────────────────────────────────────────

export interface SelectAtomsInput {
  conceptAtoms: ContentAtom[];
  conceptMeta: ConceptMeta;
  studentModel: StudentModel | null;
  sessionContext: SessionContext;
  routeRequest: RouteRequest;
}

/**
 * Returns the ordered ContentAtom[] to serve for this lesson view.
 *
 * Algorithm:
 *   1. Read mastery → classify tier (cold/building/solidifying/exam-ready)
 *   2. Apply ExamOverlay filtering (skip_atom_types + required_bloom_levels)
 *   3. Apply preferred_exam_id filter (atoms with matching exam_ids or "*")
 *   4. Order by tier's default atom-type sequence
 *   5. E6: if exam_proximity_days < 21, reorder to exam_pattern → common_traps → retrieval → micro_exercise
 *   6. E5: if error_streak >= 3, inject common_traps and switch modality
 *   7. Fallback: if < 2 atoms remain, return originals unchanged (caller handles fallback)
 */
export function selectAtoms(input: SelectAtomsInput): ContentAtom[] {
  const { conceptAtoms, conceptMeta, studentModel, sessionContext, routeRequest } = input;

  if (conceptAtoms.length === 0) return [];

  const concept_id = conceptMeta.concept_id;
  const mastery = readMasteryScore(studentModel, concept_id);
  const tier = classifyMastery(mastery);

  const preferred_exam_id =
    routeRequest.preferred_exam_id ??
    null;

  const overlay = preferred_exam_id
    ? conceptMeta.exam_overlays?.[preferred_exam_id]
    : undefined;

  // 1. Filter
  let candidates = conceptAtoms.filter(
    (a) => passesExamOverlay(a, overlay) && passesExamFilter(a, preferred_exam_id),
  );

  // 2. Filter by difficulty: serve atoms whose difficulty <= mastery + 0.2 buffer
  // (so "cold" students don't get advanced atoms; mastery 0.0 still gets difficulty <= 0.2)
  candidates = candidates.filter((a) => a.difficulty <= mastery + 0.25);
  // If the difficulty filter killed everything, fall back to the unfiltered set
  if (candidates.length === 0) {
    candidates = conceptAtoms.filter(
      (a) => passesExamOverlay(a, overlay) && passesExamFilter(a, preferred_exam_id),
    );
  }

  // 3. Order by tier
  let ordered = orderByTypeList(candidates, TIER_ORDER[tier]);

  // 4. E6 — Exam Countdown Mode (< 21 days)
  const proximity =
    routeRequest.exam_proximity_days ?? sessionContext.exam_proximity_days;
  if (proximity != null && proximity < 21) {
    ordered = orderByTypeList(candidates, COUNTDOWN_ORDER);
  }

  // 5. E5 — Error Streak Modality Switch
  if (sessionContext.error_streak >= 3) {
    const trapsAtoms = candidates.filter((a) => a.atom_type === 'common_traps');
    let modalitySwitchAtom: ContentAtom | null = null;
    for (const wantedType of ERROR_STREAK_FALLBACK_CHAIN) {
      const found = candidates.find((a) => a.atom_type === wantedType);
      if (found) {
        modalitySwitchAtom = found;
        break;
      }
    }
    // Build streak-response head: trap first (if exists), then the modality switch (if found).
    const head: ContentAtom[] = [];
    if (trapsAtoms.length > 0) head.push(trapsAtoms[0]);
    if (modalitySwitchAtom && !head.includes(modalitySwitchAtom)) {
      head.push(modalitySwitchAtom);
    }
    if (head.length > 0) {
      const headIds = new Set(head.map((a) => a.id));
      ordered = [...head, ...ordered.filter((a) => !headIds.has(a.id))];
    }
  }

  // 6. Fallback when fewer than 2 atoms remain — return whatever we have;
  // lesson-routes.ts handles the explainer.md fallback at the loader layer.
  return ordered;
}
