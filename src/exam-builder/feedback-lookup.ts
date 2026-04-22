// @ts-nocheck
/**
 * Feedback Lookup — the "always consult student feedback" surface.
 *
 * Called by the orchestrator before ANY new exam/course content is
 * generated. Returns three streams of potentially-relevant feedback,
 * each GBrain-ranked:
 *
 *   1. DIRECT    — feedback on prior samples of THIS exam
 *   2. CROSS     — feedback from OTHER exams that may transfer
 *                  (ranked by topic overlap, submitter's exam_context,
 *                  prior cross-link corroborations)
 *   3. SIBLING   — applied feedback from exams with overlapping
 *                  syllabus that already shipped a fix
 *
 * Relevance signals used by GBrain:
 *   (a) exact topic_id match between feedback.target.topic_id and
 *       the exam's syllabus_topic_ids
 *   (b) submitter prepares for this exam (via exam-context bridge)
 *   (c) existing CrossExamLink pointing to this exam
 *   (d) feedback status — 'applied' feedback on a sibling exam is
 *       a stronger signal than 'submitted' (it's been reviewed)
 *
 * This module is pure read-side — no mutation. Mutations happen in
 * the orchestrator after admin review.
 */

import { listFeedback, getFeedback } from '../feedback/store';
import { listCrossLinksIncomingFor, listCrossLinksFromFeedback } from '../sample-check/store';
import { getExamAdapter, listExamAdapters } from './registry';
import type { FeedbackItem } from '../feedback/types';

// ============================================================================

export interface FeedbackRelevance {
  feedback: FeedbackItem;
  stream: 'direct' | 'cross' | 'sibling';
  score: number;                          // 0..1
  confidence: 'high' | 'medium' | 'low';
  signals: {
    same_exam?: boolean;
    topic_id_match?: boolean;
    submitter_prepares_for_target?: boolean;
    has_cross_link_to_target?: boolean;
    status_applied?: boolean;
    corroboration_count?: number;
  };
  rationale: string;
}

export interface FeedbackLookupReport {
  exam_id: string;
  generated_at: string;
  streams: {
    direct: FeedbackRelevance[];
    cross: FeedbackRelevance[];
    sibling: FeedbackRelevance[];
  };
  counts: {
    direct_total: number;
    direct_applied: number;
    direct_open: number;
    cross_total: number;
    cross_high_confidence: number;
    sibling_total: number;
  };
  /**
   * Consolidated recommendations to the orchestrator: what feedback
   * items to PRE-APPLY before LLM generation (because they're
   * high-confidence + applicable), and what to surface to admin for
   * manual review.
   */
  recommendations: {
    pre_apply_ids: string[];
    review_required_ids: string[];
    defer_ids: string[];
  };
}

// ============================================================================

/**
 * Main entry — collect and rank all feedback that might apply to a
 * new or updated build of exam_id. Synchronous helpers do the heavy
 * lifting; the top-level call is async only because the GBrain
 * exam-context lookup is.
 */
export async function lookupFeedbackForBuild(
  exam_id: string,
): Promise<FeedbackLookupReport> {
  const adapter = getExamAdapter(exam_id);
  const targetTopicIds = new Set(adapter?.getSyllabusTopicIds() ?? []);

  const direct: FeedbackRelevance[] = [];
  const cross: FeedbackRelevance[] = [];
  const sibling: FeedbackRelevance[] = [];

  // --- DIRECT stream ---------------------------------------------------
  const directAll = listFeedback({ exam_id });
  for (const fb of directAll) {
    direct.push({
      feedback: fb,
      stream: 'direct',
      score: fb.status === 'applied' ? 1.0 : fb.status === 'approved' ? 0.85 : 0.6,
      confidence: fb.status === 'applied' || fb.status === 'approved' ? 'high' : 'medium',
      signals: {
        same_exam: true,
        topic_id_match: Boolean(fb.target.topic_id && targetTopicIds.has(fb.target.topic_id)),
        status_applied: fb.status === 'applied',
        corroboration_count: fb.corroboration_count,
      },
      rationale: `Direct feedback on this exam (${fb.status}).`,
    });
  }

  // --- CROSS stream ---------------------------------------------------
  // 1. Incoming cross-links pointing at this exam
  const incomingLinks = listCrossLinksIncomingFor(exam_id);
  for (const link of incomingLinks) {
    const fb = getFeedback(link.source_feedback_id);
    if (!fb) continue;
    // Don't duplicate something that'd already be in DIRECT
    if (fb.target.exam_id === exam_id) continue;

    let score = 0.5;
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (link.target_status === 'applied_to_target') {
      score = 0.95; confidence = 'high';
    } else if (link.target_status === 'acknowledged') {
      score = 0.80; confidence = 'high';
    } else if (link.target_status === 'declined') {
      score = 0.15; confidence = 'low';
    } else {
      score = 0.55; confidence = 'medium';
    }

    cross.push({
      feedback: fb,
      stream: 'cross',
      score,
      confidence,
      signals: {
        has_cross_link_to_target: true,
        topic_id_match: Boolean(fb.target.topic_id && targetTopicIds.has(fb.target.topic_id)),
        status_applied: fb.status === 'applied',
      },
      rationale:
        `Cross-linked from ${link.source_exam_id}, ` +
        `target_status=${link.target_status}. ${link.rationale}`,
    });
  }

  // 2. GBrain-discovered candidates — feedback from other exams with
  //    overlapping topic_id not already accounted for via explicit links
  const linkedFbIds = new Set(incomingLinks.map(l => l.source_feedback_id));
  const allOtherExams = listExamAdapters()
    .filter(a => a.exam_id !== exam_id)
    .map(a => a.exam_id);

  for (const otherExamId of allOtherExams) {
    const otherFb = listFeedback({ exam_id: otherExamId });
    for (const fb of otherFb) {
      if (linkedFbIds.has(fb.id)) continue;         // already in cross via explicit link
      if (!fb.target.topic_id) continue;             // no topic to overlap
      if (!targetTopicIds.has(fb.target.topic_id)) continue;   // topic doesn't overlap

      // GBrain: submitter's exam_context check
      let submitterPrepares = false;
      try {
        const { getExamContextForStudent } = await import('../gbrain/exam-context');
        const ctx = await getExamContextForStudent(fb.submitted_by.user_id).catch(() => null);
        submitterPrepares = ctx?.exam_id === exam_id;
      } catch {}

      // Scoring: topic match baseline 0.4, +0.3 if submitter preps target,
      // +0.2 if corroborated, +0.1 if already applied on source
      let score = 0.4;
      if (submitterPrepares) score += 0.3;
      if (fb.corroboration_count >= 2) score += 0.2;
      if (fb.status === 'applied') score += 0.1;
      const confidence: 'high' | 'medium' | 'low' =
        score >= 0.75 ? 'high' : score >= 0.55 ? 'medium' : 'low';

      cross.push({
        feedback: fb,
        stream: 'cross',
        score: Math.min(1, score),
        confidence,
        signals: {
          topic_id_match: true,
          submitter_prepares_for_target: submitterPrepares,
          has_cross_link_to_target: false,
          status_applied: fb.status === 'applied',
          corroboration_count: fb.corroboration_count,
        },
        rationale:
          `GBrain match on topic '${fb.target.topic_id}' from ${otherExamId}. ` +
          (submitterPrepares ? 'Submitter prepares for target. ' : '') +
          (fb.corroboration_count >= 2 ? `${fb.corroboration_count} corroborations. ` : '') +
          `Source status: ${fb.status}.`,
      });
    }
  }

  // --- SIBLING stream -------------------------------------------------
  // Applied feedback on other exams that share a topic with our exam —
  // useful as "reference fixes": if JEE already fixed a wrong-answer
  // for a calculus MCQ that BITSAT also has, BITSAT should check.
  for (const otherExamId of allOtherExams) {
    const appliedFb = listFeedback({ exam_id: otherExamId, status: 'applied' });
    for (const fb of appliedFb) {
      if (!fb.target.topic_id) continue;
      if (!targetTopicIds.has(fb.target.topic_id)) continue;
      // Don't duplicate — if it's already in cross, skip
      if (cross.some(c => c.feedback.id === fb.id)) continue;
      sibling.push({
        feedback: fb,
        stream: 'sibling',
        score: 0.6,
        confidence: 'medium',
        signals: {
          topic_id_match: true,
          status_applied: true,
        },
        rationale:
          `Similar fix applied on ${otherExamId} for topic '${fb.target.topic_id}'. ` +
          `Review whether the same issue exists here.`,
      });
    }
  }

  // Sort all streams by score desc
  direct.sort((a, b) => b.score - a.score);
  cross.sort((a, b) => b.score - a.score);
  sibling.sort((a, b) => b.score - a.score);

  // Recommendations
  const pre_apply_ids: string[] = [];
  const review_required_ids: string[] = [];
  const defer_ids: string[] = [];

  for (const r of direct) {
    if (r.feedback.status === 'approved') pre_apply_ids.push(r.feedback.id);
    else if (r.feedback.status === 'submitted' || r.feedback.status === 'triaged') {
      review_required_ids.push(r.feedback.id);
    }
  }
  for (const r of cross) {
    if (r.confidence === 'high' && r.feedback.status === 'applied') pre_apply_ids.push(r.feedback.id);
    else if (r.confidence !== 'low') review_required_ids.push(r.feedback.id);
    else defer_ids.push(r.feedback.id);
  }
  for (const r of sibling) review_required_ids.push(r.feedback.id);

  return {
    exam_id,
    generated_at: new Date().toISOString(),
    streams: { direct, cross, sibling },
    counts: {
      direct_total: direct.length,
      direct_applied: direct.filter(r => r.feedback.status === 'applied').length,
      direct_open: direct.filter(r => r.feedback.status === 'submitted' || r.feedback.status === 'triaged').length,
      cross_total: cross.length,
      cross_high_confidence: cross.filter(r => r.confidence === 'high').length,
      sibling_total: sibling.length,
    },
    recommendations: { pre_apply_ids, review_required_ids, defer_ids },
  };
}
