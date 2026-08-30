/**
 * gate-topics-modern-bridge.ts — folds the modern practice-item catalog
 * into the legacy GATE topic/problem surface (gate-routes.ts).
 *
 * Root cause this closes (/investigate, 2026-08-30): `/api/topics` and
 * `/api/problems/:topic` only ever counted/listed the legacy, mostly-
 * vestigial `data/courses/gate-em/topics/*\/mcqs.json` PYQ bank (29 items
 * for linear-algebra), while the actively-maintained content students
 * actually practice against lives in the modern
 * `LearningObjectCatalog`/`data/practice-items/*.json` bank (~130 items
 * for linear-algebra) — a roughly 4-5x undercount, on the FIRST screen a
 * teacher or student sees.
 *
 * Security contract: every summary returned here is answer-key-free by
 * construction (no `correct_answer`, no `options`) — matches the
 * render-safe discipline `GET /api/practice/item/:id` already enforces.
 * A modern item reached through this legacy browse surface must be
 * graded through the safe, server-side `/attempt/:objectId` flow, never
 * through PracticePage's legacy client-side string-compare grading (see
 * `PracticePage.tsx`'s redirect for the other half of this contract).
 */

import { getConceptsForTopic } from '../constants/concept-graph';
import { getLearningObjectCatalog } from '../scoring/learning-object-catalog-pg';
import { gateItemFromPayload } from './practice-routes';
import type { LearningObject } from '../core/interfaces';

/**
 * Legacy topic ids (src/curriculum/topic-adapter.ts, read by
 * gate-routes.ts) that don't literally match concept-graph.ts's topic
 * slugs. Small and closed — add an entry only if a genuinely new mismatch
 * shows up, never widen this into a general slug-normalizer.
 */
const TOPIC_ID_ALIASES: Record<string, string> = {
  transforms: 'transform-theory',
  discrete: 'discrete-mathematics',
};

function conceptGraphTopicId(legacyTopicId: string): string {
  return TOPIC_ID_ALIASES[legacyTopicId] ?? legacyTopicId;
}

// Wide enough to catch every authored item regardless of its Elo band —
// this is a browse/count surface, not a difficulty-targeted probe pick.
const WIDE_QUERY = { diffMin: 0, diffMax: 3000, limit: 500, types: ['practice'] as const };

async function modernGradableItemsForTopic(legacyTopicId: string): Promise<LearningObject[]> {
  const concepts = getConceptsForTopic(conceptGraphTopicId(legacyTopicId));
  if (concepts.length === 0) return [];
  const catalog = getLearningObjectCatalog();
  const perConcept = await Promise.all(
    concepts.map((c) => catalog.query({ skillId: c.id, ...WIDE_QUERY })),
  );
  // Only count/list items the deterministic scorer can actually grade —
  // the same gradability bar POST /api/practice/attempt already enforces,
  // rather than inventing a second, looser definition of "a problem".
  return perConcept.flat().filter((o) => typeof gateItemFromPayload(o.id, o.payload) !== 'string');
}

export async function countModernProblemsForTopic(legacyTopicId: string): Promise<number> {
  return (await modernGradableItemsForTopic(legacyTopicId)).length;
}

/** Coarse Elo-band bucketing for display only — never fed back into grading. */
function difficultyLabel(elo: number): 'easy' | 'medium' | 'hard' {
  if (elo < 1300) return 'easy';
  if (elo < 1700) return 'medium';
  return 'hard';
}

/** Answer-key-free summary — the ONLY shape a modern item may take on this legacy surface. */
export interface ModernProblemSummary {
  id: string;
  exam_id: null;
  year: null;
  question_text: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  source: 'modern_catalog';
}

function toSummary(o: LearningObject, legacyTopicId: string): ModernProblemSummary {
  const payload = o.payload as { questionText?: string; maxMarks?: number };
  return {
    id: o.id,
    exam_id: null,
    year: null,
    question_text: payload.questionText ?? '',
    topic: legacyTopicId,
    difficulty: difficultyLabel(o.difficulty),
    marks: typeof payload.maxMarks === 'number' && payload.maxMarks > 0 ? payload.maxMarks : 1,
    source: 'modern_catalog',
  };
}

export async function listModernProblemsForTopic(legacyTopicId: string): Promise<ModernProblemSummary[]> {
  const items = await modernGradableItemsForTopic(legacyTopicId);
  return items.map((o) => toSummary(o, legacyTopicId));
}

/**
 * Resolve a single modern-catalog item by id — the fallback
 * `handleGetProblemById` reaches for once the legacy DB/static lookups
 * both come up empty. Deliberately answer-key-free; PracticePage.tsx
 * detects the missing `correct_answer` and redirects to `/attempt/:id`
 * instead of rendering its own (unusable, and unsafe if it somehow
 * weren't) client-graded answer form.
 */
export async function getModernProblemById(id: string): Promise<ModernProblemSummary | null> {
  const catalog = getLearningObjectCatalog();
  if (!catalog.getById) return null;
  const obj = await catalog.getById(id);
  if (!obj || obj.type !== 'practice') return null;
  if (typeof gateItemFromPayload(obj.id, obj.payload) === 'string') return null;
  const topicId = (obj.payload as { topic?: string } | null)?.topic ?? obj.nodeId;
  return toSummary(obj, topicId);
}
