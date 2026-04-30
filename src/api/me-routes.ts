// @ts-nocheck
/**
 * Me Routes — unified GBrain-aware student summary
 *
 * Single source of truth for any feature that needs GBrain-aware context
 * about the current user. Instead of every client surface calling 3-4
 * endpoints separately (exam-context, giveaway, student-model, mastery),
 * they can call this one endpoint and get everything.
 *
 * Purpose: makes GBrain integration uniform across features. New features
 * can consume this endpoint rather than re-implementing GBrain lookup logic.
 *
 * GET /api/me/gbrain-summary — returns GBrainSummary for the signed-in user
 *
 * The response shape is additive — new fields can be added without breaking
 * existing consumers.
 */

import type { ServerResponse } from 'http';
import { sendJSON, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAuth } from '../auth/middleware';
import { getUserById } from '../auth/user-store';
import { getOrCreateStudentModel } from '../gbrain/student-model';
import { getExamContextForStudent } from '../gbrain/exam-context';
import { resolveGiveaway } from '../exams/exam-group-store';
import { getExam } from '../exams/exam-store';
import { EXAMS as STATIC_EXAMS } from '../syllabus/exam-catalog';
import { computeCoverage, coverageLabel, coverageTier } from '../gbrain/cross-exam-coverage';

// ============================================================================

async function handleGBrainSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const user_id = auth.user.id;
  const user = getUserById(user_id);

  // Load student model (may not exist yet for fresh users)
  let model = null;
  try {
    model = await getOrCreateStudentModel(user_id);
  } catch {
    model = null;
  }

  // Mastery summary — derived from model.mastery_vector
  const vec = model?.mastery_vector || {};
  const entries = Object.entries(vec);
  let mastered = 0, covered = 0, in_progress = 0, struggling = 0;
  const weakConcepts: Array<{ concept_id: string; score: number; attempts: number }> = [];
  const strongConcepts: Array<{ concept_id: string; score: number }> = [];

  for (const [cid, entry] of entries) {
    const e = entry as any;
    if (!e.attempts) continue;
    if (e.score >= 0.8) { mastered++; strongConcepts.push({ concept_id: cid, score: e.score }); }
    else if (e.score >= 0.5) covered++;
    else if (e.score >= 0.3) in_progress++;
    else { struggling++; weakConcepts.push({ concept_id: cid, score: e.score, attempts: e.attempts }); }
  }

  weakConcepts.sort((a, b) => a.score - b.score);
  strongConcepts.sort((a, b) => b.score - a.score);

  // Exam context — feeds urgency + personalization
  const examContext = await getExamContextForStudent(user_id);

  // Giveaway (if assigned to an approved group)
  let giveawayInfo = null;
  if (user?.exam_id) {
    const raw = resolveGiveaway(user.exam_id);
    if (raw) {
      // Attach per-bonus-exam coverage
      const enrichedBonus = raw.bonus_exams.map(bonus => {
        let topics: string[] = [];
        if (bonus.source === 'dynamic') {
          const e = getExam(bonus.id);
          if (e?.syllabus) topics = e.syllabus.map(t => t.topic_id).filter(Boolean);
          else if (e?.topic_weights) topics = Object.keys(e.topic_weights);
        } else {
          const s = (STATIC_EXAMS as any)[bonus.id];
          if (s?.topics) topics = s.topics;
        }
        const cov = computeCoverage(model, topics);
        return {
          id: bonus.id,
          name: bonus.name,
          coverage_percent: cov.coverage_percent,
          mastery_percent: cov.mastery_percent,
          tier: coverageTier(cov),
          label: coverageLabel(cov),
        };
      });
      enrichedBonus.sort((a, b) => b.coverage_percent - a.coverage_percent);
      giveawayInfo = {
        group_id: raw.group_id,
        group_name: raw.group_name,
        tagline: raw.tagline,
        primary_exam_name: raw.primary_exam.name,
        bonus_exams: enrichedBonus,
      };
    }
  }

  // Recent attempts — last 10 from the model
  const recentAttempts = (model as any)?.recent_attempts?.slice(-10) || [];

  sendJSON(res, {
    user: {
      id: user_id,
      role: (user as any)?.role,
      exam_id: user?.exam_id,
    },
    mastery: {
      total_concepts_attempted: entries.filter(([, e]: any) => e.attempts).length,
      mastered_count: mastered,
      covered_count: covered,
      in_progress_count: in_progress,
      struggling_count: struggling,
      weak_concepts_preview: weakConcepts.slice(0, 5),
      strong_concepts_preview: strongConcepts.slice(0, 5),
    },
    exam_context: examContext,   // null if no exam_id or exam deleted
    giveaway: giveawayInfo,       // null if no approved group match
    recent_attempts: recentAttempts,
    /**
     * Derived 'what matters now' signal. Feature surfaces can use this
     * to render a single prominent call-to-action without needing to
     * reason about all the state themselves.
     */
    focus_signal: computeFocusSignal({
      mastered_count: mastered,
      struggling_count: struggling,
      examContext,
      giveawayInfo,
    }),
  });
}

/**
 * Produce a single concise 'what matters right now' signal that any UI
 * surface can render. Prioritized:
 *   1. Exam imminent (<7 days) and exam is primary focus
 *   2. Struggling concepts need attention
 *   3. Bonus exam is ≥80% covered → nudge to claim it
 *   4. No exam context → encouraging general message
 */
function computeFocusSignal(p: {
  mastered_count: number;
  struggling_count: number;
  examContext: any;
  giveawayInfo: any;
}): { kind: string; message: string; action?: string; href?: string } {
  if (p.examContext?.exam_is_imminent) {
    return {
      kind: 'exam_imminent',
      message: `Your exam is in ${p.examContext.days_to_exam} day${p.examContext.days_to_exam !== 1 ? 's' : ''} — focus on your weakest concepts now.`,
      action: 'Review priorities',
      href: '/smart-practice',
    };
  }
  if (p.struggling_count >= 3) {
    return {
      kind: 'struggling',
      message: `${p.struggling_count} concepts need work. A focused review session will help.`,
      action: 'Start review',
      href: '/smart-practice',
    };
  }
  if (p.giveawayInfo?.bonus_exams?.[0]?.coverage_percent >= 0.8) {
    const bonus = p.giveawayInfo.bonus_exams[0];
    return {
      kind: 'bonus_ready',
      message: `You've already covered ${Math.round(bonus.coverage_percent * 100)}% of ${bonus.name} — you're almost there.`,
      action: 'Switch exam focus',
      href: '/exam-setup',
    };
  }
  if (p.examContext?.exam_is_close) {
    return {
      kind: 'exam_close',
      message: `${p.examContext.days_to_exam} days to your exam. Steady practice will compound.`,
      action: 'Continue practice',
      href: '/smart-practice',
    };
  }
  if (p.mastered_count > 0) {
    return {
      kind: 'momentum',
      message: `You've mastered ${p.mastered_count} concept${p.mastered_count !== 1 ? 's' : ''}. Keep going.`,
    };
  }
  return {
    kind: 'fresh_start',
    message: 'Ready when you are. Start with one concept — mastery compounds.',
    action: 'Pick a concept',
    href: '/lessons',
  };
}

// ============================================================================
// v2.6: Compounding Visibility endpoint
//
// Returns concrete evidence of the v2.4 design system's "Compounding" promise:
// "every rep adds; what you cracked in October is still with you in November."
//
// The frontend CompoundingCard polls this; backend decides via `should_show`
// whether to surface the card today (cadence: weekly OR after a 3+ session
// streak). Failure-soft on the frontend — empty/error response renders nothing.
// ============================================================================

async function handleCompounding(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAuth(req, res);
  if (!auth) return; // requireAuth sent 401

  const user = getUserById(auth.user.id);
  if (!user) {
    return sendJSON(res, { should_show: false, headline: '' });
  }

  // Pull the student model for mastery + attempt history.
  const model = getOrCreateStudentModel(auth.user.id);
  if (!model) {
    return sendJSON(res, { should_show: false, headline: '' });
  }

  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // Compute Compounding metrics from the student model.
  // Schema is loose — be defensive about missing fields.
  const mastery = (model as any).concept_mastery ?? {};
  const attempts = (model as any).recent_attempts ?? [];

  const recentAttempts = Array.isArray(attempts)
    ? attempts.filter((a: any) => {
        const ts = a?.timestamp ?? a?.attempted_at ?? null;
        if (!ts) return false;
        const t = typeof ts === 'string' ? Date.parse(ts) : Number(ts);
        return Number.isFinite(t) && now - t < THIRTY_DAYS_MS;
      })
    : [];

  const conceptsMastered = Object.values(mastery).filter(
    (m: any) => typeof m === 'number' ? m >= 0.85 : (m?.value ?? 0) >= 0.85,
  ).length;

  const totalConcepts = Object.keys(mastery).length;
  const problems30d = recentAttempts.length;

  // Cadence: show when there's something to celebrate. Either:
  //   - 5+ problems in last 30 days (active student)
  //   - At least 1 concept mastered
  // Otherwise hide (no compounding-evidence to show).
  const should_show = problems30d >= 5 || conceptsMastered >= 1;

  if (!should_show) {
    return sendJSON(res, { should_show: false, headline: '' });
  }

  // Headline composition. Lead with the most concrete number.
  let headline: string;
  let subline: string | undefined;
  if (conceptsMastered >= 1 && problems30d >= 5) {
    headline = `${problems30d} problems this month — ${conceptsMastered} concept${conceptsMastered === 1 ? '' : 's'} mastered.`;
    subline = totalConcepts > conceptsMastered
      ? `${totalConcepts - conceptsMastered} more to go. Every rep gets you closer.`
      : 'You\'re on a streak — keep showing up.';
  } else if (conceptsMastered >= 1) {
    headline = `${conceptsMastered} concept${conceptsMastered === 1 ? '' : 's'} mastered so far.`;
    subline = 'What you cracked once is still with you. Keep going.';
  } else {
    headline = `${problems30d} problems in the last 30 days.`;
    subline = 'You\'re building momentum. Every problem teaches the system more about how you think.';
  }

  return sendJSON(res, {
    should_show: true,
    headline,
    subline,
    details: [
      { label: 'problems', value: problems30d, hint: 'last 30 days' },
      { label: 'concepts', value: conceptsMastered, hint: 'mastered (≥85%)' },
      { label: 'concepts seen', value: totalConcepts },
      { label: 'streak', value: '—', hint: 'coming soon' },
    ],
  });
}

// ============================================================================

export const meRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/me/gbrain-summary', handler: handleGBrainSummary },
  { method: 'GET', path: '/api/student/compounding', handler: handleCompounding },
];
