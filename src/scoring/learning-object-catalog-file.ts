/**
 * FileLearningObjectCatalog — authored gradable items, no database required.
 *
 * The gradable path was Postgres-only. `/api/practice/item/:id` resolves through
 * `PgLearningObjectCatalog`, nothing in the repo seeds `generated_problems`, and
 * `demo/Dockerfile` records that those tables are never created on the demo
 * deploy. So a DB-less instance — which is what an offline venue runs — had no
 * gradable item at all, and "the win is earned on a real item" had nothing
 * behind it.
 *
 * This reads items authored as content from `data/practice-items/*.json` and
 * maps them onto the same `LearningObject` shape `rowToLearningObject` produces,
 * with the same marking payload keys `markingPayloadFromRow` emits. That
 * equivalence is the point: `GateDeterministicScorer` cannot tell a file-backed
 * item from a database row, so grading is genuinely the same code path and a
 * mark earned here is a real mark.
 *
 * It is a FALLBACK, not a replacement. With `DATABASE_URL` set the Postgres
 * catalog wins, because that is where generated content lives and where
 * exposure counts are tracked. This exists so that a deployment without a
 * database degrades to a smaller real catalog rather than to none.
 */

import fs from 'fs';
import path from 'path';
import type {
  LearningObjectCatalog,
  CatalogQuery,
} from './learning-object-catalog';
import type { LearningObject, ObjectType } from '../core/interfaces';
import { difficultyToElo, DEFAULT_EXAM_RELEVANCE } from './difficulty-elo';

const ITEMS_DIR = path.join(process.cwd(), 'data', 'practice-items');

/** Mirrors DEFAULT_EST_MINUTES in the pg catalog so the two agree on unstated fields. */
const DEFAULT_EST_MINUTES = 3;

/**
 * Exported so producers of this exact shape (the practice-item factory's
 * assemble.ts, src/generation/practice-item-factory/) can target it
 * directly instead of duplicating the field list.
 */
export interface AuthoredItem {
  id: string;
  concept_id: string;
  topic?: string;
  difficulty?: number;
  question_type?: string;
  marks?: number;
  question_text?: string;
  options?: string[];
  answer_index?: number;
  answer_indices?: number[];
  answer_range?: [number, number];
  correct_answer?: string;
  solution_steps?: string[];
  verification_method?: string;
  /**
   * Optional — concept ids (besides `concept_id`) the solution genuinely
   * exercises as a real step (e.g. an eigenvalues item whose solution
   * computes a determinant along the way). Metadata only: it does not
   * change grading or the marking payload, only what a concept-coverage
   * report can credit this item toward. Validated against known concept
   * ids by `scripts/check-practice-items.ts`.
   */
  also_tests?: string[];
}

const GATE_KINDS = new Set(['mcq', 'msq', 'nat']);

/**
 * Build the marking payload, refusing anything half-specified.
 *
 * Same discipline as `markingPayloadFromRow`: an item missing its answer key or
 * its marks is returned WITHOUT marking rather than with a guess, so the route
 * reports it as not gradable instead of grading it wrongly. A demo that marks a
 * correct answer wrong is worse than one that declines to mark.
 */
function markingPayload(item: AuthoredItem): Record<string, unknown> {
  const kind = item.question_type;
  const marks = item.marks;
  if (!kind || !GATE_KINDS.has(kind) || typeof marks !== 'number' || !(marks > 0)) return {};
  const out: Record<string, unknown> = { questionType: kind, marks };
  if ((kind === 'mcq' || kind === 'msq') && Array.isArray(item.options) && item.options.length > 0) {
    out.options = item.options;
  }
  if (kind === 'mcq' && typeof item.answer_index === 'number' && item.answer_index >= 0) {
    out.answerIndex = item.answer_index;
  }
  if (kind === 'msq' && Array.isArray(item.answer_indices)
      && item.answer_indices.every((i) => typeof i === 'number' && i >= 0)) {
    out.answerIndices = item.answer_indices;
  }
  if (kind === 'nat' && Array.isArray(item.answer_range) && item.answer_range.length === 2
      && item.answer_range.every((n) => typeof n === 'number')) {
    out.answerRange = item.answer_range;
  }
  return out;
}

/**
 * Derive the SERVED `verification` label (the closed 3-value enum on
 * `LearningObject`) from the item's own `verification_method` string,
 * rather than hardcoding every authored item to `human_verified`. That
 * hardcode was harmless while every shipped item was hand-checked, but
 * the T7 factory pipeline (src/generation/practice-item-factory/) stamps
 * `verification_method: 'wolfram_verified'` for numerically-checked items
 * — those ARE a CAS pass and must be labelled `cas_passed`, not quietly
 * downgraded to `human_verified` (the receipt law: never blur the two).
 * Every other method (hand_checkable_*, dual_model_consensus, authored,
 * or absent) is the weaker human/consensus-verified claim.
 */
export function verificationLabelFor(method: string | undefined): LearningObject['verification'] {
  return method === 'wolfram_verified' ? 'cas_passed' : 'human_verified';
}

function toLearningObject(item: AuthoredItem): LearningObject {
  return {
    id: item.id,
    nodeId: item.concept_id,
    type: 'practice' as ObjectType,
    difficulty: difficultyToElo(Number(item.difficulty ?? 0.5)),
    estMinutes: DEFAULT_EST_MINUTES,
    prereqs: [],
    verification: verificationLabelFor(item.verification_method),
    payload: {
      skillId: item.concept_id,
      topic: item.topic ?? null,
      questionText: item.question_text ?? null,
      correctAnswer: item.correct_answer ?? null,
      solutionSteps: item.solution_steps ?? [],
      distractors: [],
      maxMarks: typeof item.marks === 'number' && item.marks > 0 ? item.marks : 1,
      examRelevance: DEFAULT_EXAM_RELEVANCE,
      verificationMethod: item.verification_method ?? 'authored',
      timesServed: 0,
      ...markingPayload(item),
    },
  };
}

export class FileLearningObjectCatalog implements LearningObjectCatalog {
  private cache: LearningObject[] | null = null;

  private load(): LearningObject[] {
    if (this.cache) return this.cache;
    const out: LearningObject[] = [];
    try {
      for (const file of fs.readdirSync(ITEMS_DIR)) {
        if (!file.endsWith('.json')) continue;
        const raw = JSON.parse(fs.readFileSync(path.join(ITEMS_DIR, file), 'utf8'));
        for (const item of raw.items ?? []) {
          if (item?.id && item?.concept_id) out.push(toLearningObject(item));
        }
      }
    } catch {
      // A missing or unreadable directory means no authored items, which is a
      // legitimate state — not every deployment ships them.
    }
    this.cache = out;
    return out;
  }

  async query(q: CatalogQuery): Promise<LearningObject[]> {
    const limit = Math.max(1, Math.min(500, q.limit ?? 50));
    const types = q.types && q.types.length ? new Set(q.types) : null;
    return this.load()
      // Authored items map skill onto concept_id, matching how the pg catalog
      // reads skillId off the payload rather than through the node graph.
      .filter((o) => ((o.payload as { skillId?: string })?.skillId ?? o.nodeId) === q.skillId)
      .filter((o) => (types ? types.has(o.type) : true))
      .filter((o) => (typeof q.diffMin === 'number' ? o.difficulty >= q.diffMin : true))
      .filter((o) => (typeof q.diffMax === 'number' ? o.difficulty <= q.diffMax : true))
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, limit);
  }

  async getById(objectId: string): Promise<LearningObject | null> {
    return this.load().find((o) => o.id === objectId) ?? null;
  }

  /** Authored items are not exposure-tracked; 0 keeps the selector's maths sane. */
  async exposureCount(): Promise<number> {
    return 0;
  }

  /** Test seam — drops the parsed cache so a fixture directory takes effect. */
  __resetForTests(): void {
    this.cache = null;
  }
}
