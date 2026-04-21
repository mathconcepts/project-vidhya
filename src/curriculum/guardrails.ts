// @ts-nocheck
/**
 * Guardrails
 *
 * Three-layer safety system ensuring interactions stay within the active
 * exam's syllabus scope:
 *
 *   1. Concept-scope match — detected concept must be in exam.concept_links
 *   2. Depth compatibility  — content depth ≤ allowed depth + 1 tier
 *   3. Restriction compliance — content doesn't hit any restriction tag
 *
 * Used by:
 *   - The Lesson composer (before user material flows into a component)
 *   - The intent analyzer path (when the student is exam-bound)
 *   - Admin validation tools (to audit bundle content pre-publish)
 *
 * Pure functions. No LLM calls. Fast-path via concept-graph lookups.
 */

import { ALL_CONCEPTS } from '../constants/concept-graph';
import { getConceptLink, depthToMaxDifficulty } from './concept-exam-map';
import type {
  GuardrailCheckResult,
  ConceptDepth,
  ConceptExamLink,
} from './types';

// ============================================================================
// Depth inference from text (keyword heuristic — no LLM)
// ============================================================================

const ADVANCED_KEYWORDS = [
  'proof', 'theorem', 'lemma', 'corollary', 'axiomatic', 'rigorous',
  'abstract', 'functional analysis', 'measure theory', 'topology',
  'operator theory', 'spectral theorem', 'infinite dimensional',
  'general case', 'for all', 'universal', 'banach', 'hilbert',
];
const INTRODUCTORY_KEYWORDS = [
  'shortcut', 'trick', 'mnemonic', 'quick', 'simply', 'easy way',
  'rule of thumb', 'for example, let', 'plug in', 'substitute',
  'simple case', '2×2', '3×3', 'intuition', 'picture',
];

export function inferDepthFromText(text: string): ConceptDepth {
  const lower = text.toLowerCase();
  let advHits = 0, introHits = 0;
  for (const k of ADVANCED_KEYWORDS) if (lower.includes(k)) advHits++;
  for (const k of INTRODUCTORY_KEYWORDS) if (lower.includes(k)) introHits++;
  if (advHits >= 2 && advHits > introHits) return 'advanced';
  if (introHits >= 2 && introHits > advHits) return 'introductory';
  return 'standard';
}

const DEPTH_ORDER: ConceptDepth[] = ['introductory', 'standard', 'advanced'];

function depthsCompatible(contentDepth: ConceptDepth, examDepth: ConceptDepth): boolean {
  // Allow content at exam depth or one level lower (down is always fine,
  // one level up is fine because "standard" exam can use "advanced" deep dive
  // for motivated students — the UI can collapse advanced content by default).
  // Two levels up is too much.
  const cIdx = DEPTH_ORDER.indexOf(contentDepth);
  const eIdx = DEPTH_ORDER.indexOf(examDepth);
  return cIdx - eIdx <= 1;
}

// ============================================================================
// Concept classification for a text chunk
// ============================================================================

/**
 * Classify a text chunk to a concept_id by matching against concept labels
 * and descriptions. Simple word-overlap heuristic — good enough for
 * guardrail gating, which isn't safety-critical.
 *
 * Returns (concept_id, confidence). Confidence ∈ [0, 1].
 */
export function classifyChunkToConcept(text: string): { concept_id: string | null; confidence: number } {
  const lower = text.toLowerCase();
  let best: { concept_id: string; score: number } | null = null;

  for (const c of ALL_CONCEPTS) {
    // Score = keyword matches on label + keywords from description
    const labelTokens = c.label.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const descTokens = (c.description || '').toLowerCase().split(/\s+/).filter(t => t.length > 4);
    let hits = 0;
    for (const t of labelTokens) if (lower.includes(t)) hits += 3;
    for (const t of descTokens.slice(0, 10)) if (lower.includes(t)) hits += 1;
    if (!best || hits > best.score) best = { concept_id: c.id, score: hits };
  }
  if (!best || best.score === 0) return { concept_id: null, confidence: 0 };
  // Normalize: 10 hits = high confidence, 1 hit = low
  const confidence = Math.min(1, best.score / 12);
  return { concept_id: best.concept_id, confidence };
}

// ============================================================================
// Guardrail check — the main entry point
// ============================================================================

/**
 * Check whether a text chunk (user material, LLM output, etc.) is
 * acceptable for the active exam context.
 */
export function checkChunkAgainstExam(params: {
  text: string;
  exam_id: string;
  min_confidence?: number;
}): GuardrailCheckResult {
  const { text, exam_id, min_confidence = 0.15 } = params;

  // Step 1: classify to a concept
  const { concept_id, confidence } = classifyChunkToConcept(text);
  if (!concept_id) {
    return {
      allowed: false,
      matched_concept_id: null,
      confidence,
      rejection_reason: 'below-confidence',
      warning: "Couldn't determine which concept this is about — excluding to stay safe.",
    };
  }
  if (confidence < min_confidence) {
    return {
      allowed: false,
      matched_concept_id: concept_id,
      confidence,
      rejection_reason: 'below-confidence',
      warning: 'Concept match is low confidence — excluding from lesson content.',
    };
  }

  // Step 2: is the concept in this exam?
  const link = getConceptLink(concept_id, exam_id);
  if (!link) {
    return {
      allowed: false,
      matched_concept_id: concept_id,
      confidence,
      rejection_reason: 'off-syllabus',
      warning: `"${concept_id.replace(/-/g, ' ')}" is not on the ${exam_id} syllabus.`,
    };
  }

  // Step 3: depth compatibility
  const contentDepth = inferDepthFromText(text);
  if (!depthsCompatible(contentDepth, link.depth)) {
    return {
      allowed: false,
      matched_concept_id: concept_id,
      confidence,
      rejection_reason: 'depth-mismatch',
      warning: `Content depth is ${contentDepth} but the exam treats this at ${link.depth} level.`,
    };
  }

  // Step 4: restriction tag match
  const lower = text.toLowerCase();
  const hitRestriction = link.restrictions.find(r => lower.includes(r.replace(/-/g, ' ')));
  if (hitRestriction) {
    return {
      allowed: false,
      matched_concept_id: concept_id,
      confidence,
      rejection_reason: 'restricted-subtopic',
      warning: `Content touches "${hitRestriction}" which is outside the exam's scope.`,
    };
  }

  return {
    allowed: true,
    matched_concept_id: concept_id,
    confidence,
    rejection_reason: null,
    warning: null,
  };
}

// ============================================================================
// Filter a batch of chunks — used by the Lesson source resolver
// ============================================================================

export interface GuardedChunk<T = any> {
  chunk: T;
  result: GuardrailCheckResult;
}

export function filterChunksForExam<T extends { chunk_text: string }>(
  chunks: T[],
  exam_id: string,
): {
  allowed: T[];
  excluded: GuardedChunk<T>[];
} {
  if (!exam_id) {
    // No exam context — permissive; pass all through
    return { allowed: chunks, excluded: [] };
  }
  const allowed: T[] = [];
  const excluded: GuardedChunk<T>[] = [];
  for (const c of chunks) {
    const r = checkChunkAgainstExam({ text: c.chunk_text, exam_id });
    if (r.allowed) allowed.push(c);
    else excluded.push({ chunk: c, result: r });
  }
  return { allowed, excluded };
}

// ============================================================================
// LLM output validation — used when LLM-generated content is about to be
// cached or served
// ============================================================================

/**
 * Validate an LLM-produced explanation/example before serving or caching.
 * Unlike user material, LLM output can be regenerated — so we REJECT on
 * any guardrail failure rather than gracefully excluding.
 */
export function validateLLMOutput(params: {
  text: string;
  exam_id: string;
  expected_concept_id: string;
}): GuardrailCheckResult {
  const { text, exam_id, expected_concept_id } = params;
  const result = checkChunkAgainstExam({ text, exam_id, min_confidence: 0.3 });

  // Extra check: LLM must produce content ABOUT the requested concept
  if (result.allowed && result.matched_concept_id !== expected_concept_id) {
    return {
      allowed: false,
      matched_concept_id: result.matched_concept_id,
      confidence: result.confidence,
      rejection_reason: 'off-syllabus',
      warning: `LLM produced content about ${result.matched_concept_id}, expected ${expected_concept_id}.`,
    };
  }
  return result;
}
