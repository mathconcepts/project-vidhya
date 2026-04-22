// @ts-nocheck
/**
 * LLM Sample Generator — real-time LLM-backed creation of sample snapshots.
 *
 * Connects the sample-check workflow (v2.16.0) to the live LLM
 * infrastructure (src/llm/, src/content/resolver). An admin can request:
 *
 *   generateSampleSnapshot({ exam_spec, sections: [...] })
 *
 * and get back a SampleSnapshot that's been:
 *   - populated by the tiered content cascade (tier-0 bundle first,
 *     tier-2 LLM generation on miss, tier-3 Wolfram verification for math)
 *   - stamped with full provenance per content piece (model_id, tier,
 *     cost_usd, wolfram_verified)
 *   - cost-bounded (admin passes budget_usd; function aborts if exceeded)
 *   - gracefully degraded: if LLM is unavailable, returns a structured
 *     error instead of fabricating content
 *
 * Provenance is NON-OPTIONAL. Every generated piece carries its source
 * so admins (and students via the transparency surface) can see exactly
 * where each piece came from.
 *
 * This module is exam-agnostic — it takes a generic exam_spec describing
 * topic structure and emits a generic SampleSnapshot. BITSAT, GATE,
 * NEET, JEE all use the same function.
 */

import { resolveContent } from '../content/resolver';
import type { SampleSnapshot } from './types';

// ============================================================================
// Input / output contracts
// ============================================================================

export interface GenerationSection {
  /** Which section of the snapshot to generate */
  kind: 'mock_question' | 'lesson_component' | 'strategy';

  /** Topic the content belongs to */
  topic_id: string;

  /** Concept id the content targets (for tier-0 bundle lookup) */
  concept_id?: string;

  /** Difficulty target for mock questions */
  difficulty?: 'easy' | 'medium' | 'hard';

  /** For lesson_component: which of the 8 components */
  component_kind?:
    | 'hook' | 'definition' | 'intuition' | 'worked-example'
    | 'micro-exercise' | 'common-traps' | 'formal-statement' | 'connections';

  /** For mock_question: expected answer for Wolfram verification (optional) */
  expected_answer?: string;

  /** Optional seed problem text (for verification-only calls) */
  problem_text?: string;
}

export interface GenerationOptions {
  /** Max USD spend; function aborts mid-batch if exceeded */
  budget_usd?: number;
  /** Cap tier; 3 = full cascade allowed, 2 = no LLM, 0 = bundle only */
  max_tier?: 0 | 1 | 2 | 3;
  /** Force Wolfram verification for math content */
  require_wolfram?: boolean;
  /** Admin-settable correlation id for audit trail */
  correlation_id?: string;
}

export interface GenerationProvenance {
  generated_at: string;
  total_cost_usd: number;
  total_latency_ms: number;
  pieces_generated: number;
  pieces_verified_by_wolfram: number;
  tier_hits: { tier_0: number; tier_1: number; tier_2: number; tier_3: number };
  failures: Array<{ section_index: number; reason: string }>;
  budget_exceeded: boolean;
  correlation_id?: string;
}

export interface GeneratedPiece {
  section: GenerationSection;
  content: any;                 // The actual generated content
  _provenance: {
    source: 'tier-0-bundle' | 'tier-1-past-paper' | 'tier-2-llm' | 'tier-3-wolfram-verified';
    model_id?: string;
    cost_usd: number;
    latency_ms: number;
    wolfram_verified: boolean;
    generated_at: string;
  };
}

export interface GenerationResult {
  pieces: GeneratedPiece[];
  provenance: GenerationProvenance;
  /** Indicates the whole generation failed (LLM unavailable, etc.) */
  error?: { code: string; message: string };
}

// ============================================================================
// The generator
// ============================================================================

/**
 * Generate a batch of content pieces via the tiered cascade. Each section
 * in the input is resolved independently; failures in one do not abort
 * the rest unless the budget is exhausted.
 *
 * Returns a GenerationResult with per-piece provenance plus aggregate
 * provenance. Caller (typically the sample-check admin flow) stitches
 * the pieces into a SampleSnapshot.
 */
export async function generateSampleContent(
  sections: GenerationSection[],
  options: GenerationOptions = {},
): Promise<GenerationResult> {
  const started = Date.now();
  const pieces: GeneratedPiece[] = [];
  const provenance: GenerationProvenance = {
    generated_at: new Date().toISOString(),
    total_cost_usd: 0,
    total_latency_ms: 0,
    pieces_generated: 0,
    pieces_verified_by_wolfram: 0,
    tier_hits: { tier_0: 0, tier_1: 0, tier_2: 0, tier_3: 0 },
    failures: [],
    budget_exceeded: false,
    correlation_id: options.correlation_id,
  };

  const budget = options.budget_usd ?? Infinity;

  for (let i = 0; i < sections.length; i++) {
    if (provenance.total_cost_usd >= budget) {
      provenance.budget_exceeded = true;
      provenance.failures.push({ section_index: i, reason: 'budget_exceeded' });
      continue;
    }

    const section = sections[i];
    try {
      const piece = await generateOne(section, options);
      pieces.push(piece);
      provenance.pieces_generated++;
      provenance.total_cost_usd += piece._provenance.cost_usd;
      provenance.total_latency_ms += piece._provenance.latency_ms;
      if (piece._provenance.wolfram_verified) provenance.pieces_verified_by_wolfram++;
      const tierKey = piece._provenance.source === 'tier-0-bundle' ? 'tier_0'
        : piece._provenance.source === 'tier-1-past-paper' ? 'tier_1'
        : piece._provenance.source === 'tier-2-llm' ? 'tier_2'
        : 'tier_3';
      provenance.tier_hits[tierKey]++;
    } catch (err) {
      provenance.failures.push({
        section_index: i,
        reason: (err as Error).message ?? 'unknown',
      });
    }
  }

  provenance.total_latency_ms = Date.now() - started;

  // If every section failed, return the global error
  if (pieces.length === 0 && sections.length > 0) {
    return {
      pieces,
      provenance,
      error: {
        code: 'llm_unavailable_or_all_failed',
        message: `All ${sections.length} section(s) failed. First reason: ${provenance.failures[0]?.reason}`,
      },
    };
  }

  return { pieces, provenance };
}

/**
 * Generate a single piece via the resolver cascade. Translates our
 * GenerationSection into the resolver's ResolveRequest and maps the
 * result back into our GeneratedPiece shape.
 */
async function generateOne(
  section: GenerationSection,
  options: GenerationOptions,
): Promise<GeneratedPiece> {
  const t0 = Date.now();

  // For math sections that need verification, use the verify intent
  if (section.expected_answer && section.problem_text) {
    const result = await resolveContent({
      intent: 'verify',
      problem_text: section.problem_text,
      expected_answer: section.expected_answer,
      max_tier: options.max_tier ?? 3,
    });
    return mapResolverResult(section, result, t0);
  }

  // For generation of fresh content, use practice or explain intent
  const intent = section.kind === 'mock_question' ? 'practice' : 'explain';
  const topic = section.topic_id;
  const conceptId = section.concept_id;

  const result = await resolveContent({
    intent,
    topic,
    concept_id: conceptId,
    difficulty: section.difficulty,
    max_tier: options.max_tier ?? 3,
  } as any);

  return mapResolverResult(section, result, t0);
}

function mapResolverResult(
  section: GenerationSection,
  result: any,
  t0: number,
): GeneratedPiece {
  const latency = Date.now() - t0;
  const source =
    result.source === 'bundle' ? 'tier-0-bundle'
    : result.source === 'past-paper' ? 'tier-1-past-paper'
    : result.source === 'wolfram' || result.wolfram_verified ? 'tier-3-wolfram-verified'
    : 'tier-2-llm';
  return {
    section,
    content: result.content ?? result.result ?? result,
    _provenance: {
      source: source as any,
      model_id: result.model_id,
      cost_usd: Number(result.cost_estimate_usd ?? 0),
      latency_ms: latency,
      wolfram_verified: Boolean(result.wolfram_verified),
      generated_at: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Stitching — assemble pieces into a SampleSnapshot
// ============================================================================

export interface StitchInput {
  exam_spec: any;               // The Exam record (manually authored OR LLM-drafted)
  generation_result: GenerationResult;
  /** Optional hand-authored pieces to mix in */
  hand_authored?: {
    mocks?: Array<{ id: string; title: string; questions: any[] }>;
    lessons?: Array<{ id: string; components: any[] }>;
    strategies?: Array<{ title: string; content: string; evidence: string }>;
  };
}

/**
 * Stitch generated pieces into a SampleSnapshot. The exam spec is
 * passed through; mock questions, lesson components, and strategies
 * are assembled from the GenerationResult and (optionally) mixed
 * with hand-authored content.
 *
 * The stitched snapshot carries a top-level _generation_provenance
 * field so the workflow can surface "this sample is X% LLM, Y%
 * hand-authored, Wolfram-verified on Z pieces."
 */
export function stitchSnapshot(input: StitchInput): SampleSnapshot & { _generation_provenance?: any } {
  const generatedMocks: Record<string, any> = {};
  const generatedLessons: Record<string, any> = {};
  const generatedStrategies: any[] = [];

  for (const piece of input.generation_result.pieces) {
    if (piece.section.kind === 'mock_question') {
      const mockId = 'mock-generated-01';
      if (!generatedMocks[mockId]) {
        generatedMocks[mockId] = { id: mockId, title: 'LLM-generated mock', questions: [] };
      }
      generatedMocks[mockId].questions.push({
        ...piece.content,
        _provenance: piece._provenance,
      });
    } else if (piece.section.kind === 'lesson_component') {
      const lessonId = `lesson-generated-${piece.section.topic_id}`;
      if (!generatedLessons[lessonId]) {
        generatedLessons[lessonId] = { id: lessonId, components: [] };
      }
      generatedLessons[lessonId].components.push({
        kind: piece.section.component_kind,
        ...piece.content,
        _provenance: piece._provenance,
      });
    } else if (piece.section.kind === 'strategy') {
      generatedStrategies.push({ ...piece.content, _provenance: piece._provenance });
    }
  }

  const snapshot: SampleSnapshot & { _generation_provenance?: any } = {
    exam: input.exam_spec,
    mocks: [
      ...(input.hand_authored?.mocks ?? []),
      ...Object.values(generatedMocks),
    ],
    lessons: [
      ...(input.hand_authored?.lessons ?? []),
      ...Object.values(generatedLessons),
    ],
    strategies: [
      ...(input.hand_authored?.strategies ?? []),
      ...generatedStrategies,
    ],
  };

  const handMocksQ = (input.hand_authored?.mocks ?? []).reduce((n, m) => n + (m.questions?.length ?? 0), 0);
  const handLessonsC = (input.hand_authored?.lessons ?? []).reduce((n, l) => n + (l.components?.length ?? 0), 0);
  const handStrats = (input.hand_authored?.strategies ?? []).length;

  snapshot._generation_provenance = {
    ...input.generation_result.provenance,
    pieces_hand_authored: handMocksQ + handLessonsC + handStrats,
  };

  return snapshot;
}
