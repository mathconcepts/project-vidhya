// @ts-nocheck
/**
 * Next-Step Suggester
 *
 * After a multimodal response is assembled, decide whether to surface a
 * single, subtle, dismissible "want me to ...?" suggestion. This is the
 * permission-seeking layer: the system has satisfied the current intent,
 * and if there's a natural next step the student might want, we offer it
 * ONCE with a polite label. The frontend renders it as a chip the student
 * can tap to accept or dismiss.
 *
 * Design rules (the "don't irritate" constraints, in code):
 *   1. Return null when the response failed — offering followups while we
 *      didn't deliver on the current ask would feel tone-deaf.
 *   2. Return null when intent confidence is < 0.4 — if we're not sure what
 *      the user wanted, we're definitely not sure what to offer next.
 *   3. At most ONE suggestion. Never a list.
 *   4. Action must map to something the UI can do with one tap (URL navigate
 *      with pre-filled params, or a follow-up API call with no further input).
 *   5. Language: "Want me to ...?" / "Want to ...?" — never imperative.
 *   6. If the same next-step was dismissed recently in this session (client-
 *      side dedupe, via the 'dedupe_key'), the UI must hide it.
 */

import type { IntentAnalysis, MultimodalResponse } from './types';

export type NextStepAction =
  | 'practice_problems'
  | 'explain_concept'
  | 'check_your_work'
  | 'review_misconception'
  | 'build_syllabus'
  | 'save_to_notes';

export interface NextStep {
  action: NextStepAction;
  /** Short chip label, ≤ 24 chars */
  label: string;
  /** Subtitle shown below label, ≤ 80 chars */
  description: string;
  /** Stable key so the UI can dedupe dismissals across turns */
  dedupe_key: string;
  /** Target concept / topic the action operates on (for URL params) */
  target: {
    concept_id?: string;
    topic?: string;
    scope?: string;
    difficulty?: number;
  };
}

// ============================================================================
// Helpers
// ============================================================================

function responseWasHandledWell(response: Partial<MultimodalResponse>): boolean {
  const hasExplanation = !!response.explanation?.summary &&
    response.explanation.summary.length > 10 &&
    !response.explanation.summary.startsWith('Unable');
  const hasPractice = !!response.practice_problems?.length;
  const hasSolution = !!response.solution?.final_answer &&
    response.solution.final_answer.length > 0;
  const hasOCR = !!response.ocr?.text &&
    response.ocr.text.length > 0;
  return hasExplanation || hasPractice || hasSolution || hasOCR;
}

function humanizeConcept(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// Public API
// ============================================================================

export function suggestNextStep(
  analysis: IntentAnalysis,
  response: Partial<MultimodalResponse>,
): NextStep | null {
  // Rule 1: don't offer followups when we failed to answer
  if (!responseWasHandledWell(response)) return null;

  // Rule 2: don't offer when we're not sure what the user wanted
  if (analysis.intent_confidence < 0.4) return null;

  // Rule 3: need a concept to act on for most actions
  const conceptId = analysis.detected_concepts[0];
  const topic = analysis.detected_topic || undefined;
  if (!conceptId && analysis.intent !== 'extract_text') return null;

  const scope = 'mcq-rigorous';

  switch (analysis.intent) {

    // User asked "what is this?" — natural next step: try a few problems.
    case 'concept_question':
      return {
        action: 'practice_problems',
        label: 'Try 3 practice problems',
        description: `Quick self-check on ${humanizeConcept(conceptId!)}.`,
        dedupe_key: `practice:${conceptId}`,
        target: { concept_id: conceptId, topic, scope, difficulty: 0.4 },
      };

    // User asked to solve — offer similar problems to build pattern recognition.
    case 'solve_problem':
      return {
        action: 'practice_problems',
        label: 'More problems like this',
        description: `Keep the pattern fresh with 3 more ${humanizeConcept(conceptId!)} problems.`,
        dedupe_key: `practice:${conceptId}:similar`,
        target: { concept_id: conceptId, topic, scope,
                  difficulty: Math.min(0.95, analysis.estimated_difficulty + 0.1) },
      };

    // User got practice problems — offer a refresher if they seem to struggle with concept.
    case 'practice_request': {
      // Only offer concept refresh if we haven't already given an explanation
      if (response.explanation?.summary) return null;
      return {
        action: 'explain_concept',
        label: 'Refresh the concept',
        description: `Quick overview of ${humanizeConcept(conceptId!)} with a worked example.`,
        dedupe_key: `explain:${conceptId}`,
        target: { concept_id: conceptId, topic },
      };
    }

    // User asked to check their work.
    case 'solution_check': {
      const method = response.solution?.verification_method;
      if (method === 'wolfram' && response.solution?.final_answer) {
        // Check whether the answer matched (we infer from step text)
        const firstStep = response.solution.steps?.[0] || '';
        const wasCorrect = firstStep.toLowerCase().includes('correct');

        if (wasCorrect) {
          return {
            action: 'practice_problems',
            label: 'Try a harder one',
            description: `Step up the difficulty on ${humanizeConcept(conceptId!)}.`,
            dedupe_key: `practice:${conceptId}:harder`,
            target: { concept_id: conceptId, topic, scope,
                      difficulty: Math.min(0.95, analysis.estimated_difficulty + 0.2) },
          };
        }
        // Got it wrong — offer to dive into the misconception
        if (analysis.detected_error_type || analysis.detected_misconception) {
          return {
            action: 'review_misconception',
            label: 'Review this error',
            description: `Walk through why this answer went off-track.`,
            dedupe_key: `review:${conceptId}:${analysis.detected_error_type || 'error'}`,
            target: { concept_id: conceptId, topic, scope },
          };
        }
      }
      return null;
    }

    // User confused — they've had the walkthrough. Offer an easier problem to rebuild confidence.
    case 'expressing_confusion':
      return {
        action: 'practice_problems',
        label: 'Try an easier one',
        description: `Build confidence on ${humanizeConcept(conceptId!)} before coming back.`,
        dedupe_key: `practice:${conceptId}:easier`,
        target: { concept_id: conceptId, topic, scope,
                  difficulty: Math.max(0.1, analysis.estimated_difficulty - 0.2) },
      };

    // User did OCR — offer to save to notes (future: integrate with /materials)
    case 'extract_text':
      return {
        action: 'save_to_notes',
        label: 'Save to my notes',
        description: 'Keep this transcription in Materials for later.',
        dedupe_key: `save:ocr`,
        target: {},
      };

    default:
      return null;
  }
}
