// @ts-nocheck
/**
 * Rendering Routes — expose enriched lessons to the web + Telegram
 *
 *   GET  /api/lesson/:id/rendered?channel=web        EnrichedLesson for web rendering
 *   GET  /api/lesson/:id/rendered?channel=telegram   TelegramMessage[] ready to send
 *   GET  /api/lesson/:id/rendered?channel=whatsapp   WhatsAppMessage[]
 *   GET  /api/lesson/:id/rendered?channel=voice      VoiceSegment[]
 *   POST /api/lesson/:id/telegram-callback           Drive progressive-reveal state machine
 *   GET  /api/lesson/:id/enrichment-audit            Admin: see what enrichment would apply
 *
 * The lesson_id can reference:
 *   - a real composed lesson from src/lessons/composer.ts (if integrated)
 *   - a concept_id which triggers on-the-fly composition
 *
 * For v2.11.0 we implement the simpler "fetch by concept_id, compose,
 * enrich, render" path. Caching happens at the composer layer.
 */

import type { ServerResponse } from 'http';
import { sendJSON, sendError, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth } from '../auth/middleware';
import {
  enrichLesson,
  auditEnrichment,
  inferDominantType,
  type EnrichmentContext,
} from '../rendering/lesson-enrichment';
import { renderLesson, renderTelegramCallback } from '../rendering/channel-renderer';
import type { DeliveryChannel } from '../rendering/types';
import { getExamContextForStudent } from '../gbrain/exam-context';
import { getOrCreateStudentModel } from '../gbrain/student-model';

// ============================================================================
// Stub lesson fetcher — replace with real composer integration
// ============================================================================

/**
 * For v2.11.0, we return a demo lesson shape that exercises every
 * enrichment type. Real integration with src/lessons/composer.ts
 * (which has a more complex dependency on the concept graph + user
 * materials) is a follow-up.
 *
 * This demo lesson is deterministic — same concept_id always produces
 * the same lesson — so caching is safe.
 */
function getDemoLesson(concept_id: string): any {
  return {
    id: `lesson:${concept_id}`,
    concept_id,
    title: 'Eigenvalues and eigenvectors',
    components: [
      {
        id: 'c-hook',
        kind: 'hook',
        content: 'Eigenvalues tell you how a transformation stretches space along its special directions. Everywhere you have a linear system — population dynamics, quantum mechanics, image compression — you have eigenvalues.',
      },
      {
        id: 'c-definition',
        kind: 'definition',
        content: 'For a square matrix A, a non-zero vector v is an eigenvector if Av = λv for some scalar λ, called the eigenvalue. λ measures how much v is stretched; v specifies the direction that stays fixed.',
      },
      {
        id: 'c-intuition',
        kind: 'intuition',
        content: 'Imagine rotating a rubber sheet. Most vectors end up pointing in new directions. But some special directions — the eigenvectors — stay exactly the same direction. The eigenvalue tells you how much they got stretched (or shrunk) along that direction.',
      },
      {
        id: 'c-worked-example',
        kind: 'worked-example',
        problem_statement: 'Find the eigenvalues of A = [[3,1],[0,2]]',
        steps: [
          { label: 'Write the characteristic equation', content: 'We need det(A − λI) = 0.', latex: 'det(A - λI) = 0' },
          { label: 'Set up the determinant', content: 'For a 2×2 upper-triangular matrix, the determinant is the product of diagonal entries.', latex: '(3-λ)(2-λ) - 0·1 = 0' },
          { label: 'Solve for λ', content: 'The eigenvalues are the roots: λ = 3 and λ = 2.', latex: 'λ = 3, 2', is_key_step: true },
          { label: 'Interpret', content: 'The matrix has two distinct eigenvalues. For triangular matrices, eigenvalues are always the diagonal entries — memorize this shortcut.' },
        ],
      },
      {
        id: 'c-micro-exercise',
        kind: 'micro-exercise',
        prompt: 'Which of these matrices has eigenvalues {2, 5}?',
        options: [
          { text: '[[2, 0], [0, 5]]', is_correct: true },
          { text: '[[2, 5], [0, 0]]', is_correct: false, feedback_if_wrong: 'Its eigenvalues are 2 and 0, not 2 and 5.' },
          { text: '[[5, 2], [2, 5]]', is_correct: false, feedback_if_wrong: 'This symmetric matrix has eigenvalues 3 and 7.' },
          { text: '[[2, 3], [4, 5]]', is_correct: false, feedback_if_wrong: 'Its eigenvalues require solving (2-λ)(5-λ) - 12 = 0, which gives irrational values.' },
        ],
        correct_feedback: 'Right — a diagonal matrix has its eigenvalues on the diagonal.',
      },
      {
        id: 'c-common-traps',
        kind: 'common-traps',
        traps: [
          {
            mistake_description: 'Confusing eigenvalue with eigenvector — treating λ as a vector.',
            why_and_fix: 'λ is a scalar (a single number). v is the vector. The equation Av = λv has a vector on the left and a scaled vector on the right.',
            student_quote: 'I kept writing the eigenvalue with an arrow on top.',
          },
          {
            mistake_description: 'Forgetting the zero-vector exclusion.',
            why_and_fix: 'Every vector satisfies A·0 = λ·0 = 0 for any λ — but we require v ≠ 0 for eigenvectors, otherwise eigenvalues would be meaningless.',
            student_quote: 'I found v=0 as an eigenvector and thought I was done.',
          },
          {
            mistake_description: 'Assuming all matrices have real eigenvalues.',
            why_and_fix: 'Rotation matrices in ℝ² have complex eigenvalues. The characteristic polynomial may have complex roots even for real matrices.',
          },
        ],
      },
      {
        id: 'c-connections',
        kind: 'connections',
        connections: [
          { concept: 'Diagonalization', relation: 'needs n linearly independent eigenvectors' },
          { concept: 'Determinant', relation: 'equals product of eigenvalues' },
          { concept: 'Trace', relation: 'equals sum of eigenvalues' },
          { concept: 'Stability analysis', relation: 'uses sign of real part of eigenvalues' },
        ],
      },
    ],
  };
}

// ============================================================================
// Route handlers
// ============================================================================

async function handleRendered(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const concept_id = req.params.id;
  const channelParam = (req.query.get('channel') || 'web').toLowerCase();
  const validChannels: DeliveryChannel[] = ['web', 'telegram', 'whatsapp', 'voice'];
  if (!validChannels.includes(channelParam as DeliveryChannel)) {
    return sendError(res, 400, `invalid channel: ${channelParam}`);
  }

  // Hydrate EnrichmentContext from GBrain for learning-objective-aware rendering
  // Both lookups are best-effort: any failure produces null context, which
  // falls back to the deterministic v2.11.0 baseline enrichment.
  const enrichmentCtx: EnrichmentContext = {};
  try {
    const examCtx = await getExamContextForStudent(auth.user.id);
    if (examCtx) {
      enrichmentCtx.learning_objective = {
        dominant_type: inferDominantType(examCtx.question_types),
        avg_seconds_per_question:
          examCtx.duration_minutes && examCtx.total_marks
            ? Math.round((examCtx.duration_minutes * 60) / examCtx.total_marks)
            : undefined,
        negative_marks_per_wrong:
          examCtx.marking_scheme?.negative_marks_per_wrong,
        is_imminent: examCtx.exam_is_imminent,
        is_close: examCtx.exam_is_close,
        days_to_exam: examCtx.days_to_exam ?? undefined,
      };
    }
  } catch {}
  try {
    const model = await getOrCreateStudentModel(auth.user.id);
    const conceptEntry = model?.mastery_vector?.[concept_id];
    const speedEntry = (model as any)?.speed_profile?.[concept_id];
    if (conceptEntry || speedEntry) {
      // Compute cohort median ms from other concepts — rough but serviceable
      // baseline for "slow for this student's usual pace"
      let cohortMs: number | undefined;
      const allSpeeds = Object.values((model as any)?.speed_profile || {})
        .map((s: any) => s?.avg_ms)
        .filter((n: any) => typeof n === 'number' && n > 0)
        .sort((a: number, b: number) => a - b);
      if (allSpeeds.length >= 3) {
        cohortMs = allSpeeds[Math.floor(allSpeeds.length / 2)];
      }

      enrichmentCtx.mastery = {
        concept_score: conceptEntry?.score,
        attempts: conceptEntry?.attempts,
        last_error_type: (conceptEntry as any)?.last_error_type,
        recent_avg_ms: speedEntry?.avg_ms,
        cohort_median_ms: cohortMs,
      };
    }
  } catch {}

  const lesson = getDemoLesson(concept_id);
  const enriched = enrichLesson(lesson, [channelParam], enrichmentCtx);
  const rendered = renderLesson(enriched, channelParam as DeliveryChannel);

  sendJSON(res, {
    lesson_id: lesson.id,
    concept_id,
    channel: channelParam,
    rendered,
    enrichment_summary: auditEnrichment(lesson),
    // Transparency: surface which GBrain signals influenced rendering
    gbrain_context: {
      dominant_type: enrichmentCtx.learning_objective?.dominant_type,
      exam_imminent: enrichmentCtx.learning_objective?.is_imminent,
      days_to_exam: enrichmentCtx.learning_objective?.days_to_exam,
      concept_score: enrichmentCtx.mastery?.concept_score,
      recent_avg_ms: enrichmentCtx.mastery?.recent_avg_ms,
      cohort_median_ms: enrichmentCtx.mastery?.cohort_median_ms,
      is_slow_for_cohort:
        enrichmentCtx.mastery?.recent_avg_ms !== undefined
          && enrichmentCtx.mastery?.cohort_median_ms !== undefined
          && enrichmentCtx.mastery.cohort_median_ms > 0
          && enrichmentCtx.mastery.recent_avg_ms > 1.5 * enrichmentCtx.mastery.cohort_median_ms,
    },
  });
}

async function handleTelegramCallback(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const concept_id = req.params.id;
  const body = (req.body as any) || {};
  if (!body.callback_data) return sendError(res, 400, 'callback_data required');

  const lesson = getDemoLesson(concept_id);
  const enriched = enrichLesson(lesson, ['telegram']);
  const followup = renderTelegramCallback(enriched, body.callback_data);

  sendJSON(res, {
    lesson_id: lesson.id,
    followup_messages: followup,
  });
}

async function handleEnrichmentAudit(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const concept_id = req.params.id;
  const lesson = getDemoLesson(concept_id);
  const audit = auditEnrichment(lesson);
  const enriched = enrichLesson(lesson);

  sendJSON(res, {
    lesson_id: lesson.id,
    concept_id,
    audit,
    enrichment_map_keys: Object.keys(enriched.enrichments),
    total_blocks: Object.values(enriched.enrichments).reduce((n, list) => n + list.length, 0),
  });
}

// ============================================================================

export const renderingRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/lesson/:id/rendered',            handler: handleRendered },
  { method: 'POST', path: '/api/lesson/:id/telegram-callback',   handler: handleTelegramCallback },
  { method: 'GET',  path: '/api/lesson/:id/enrichment-audit',    handler: handleEnrichmentAudit },
];
