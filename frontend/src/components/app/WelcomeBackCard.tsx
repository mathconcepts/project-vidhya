/**
 * WelcomeBackCard (v4.0) — re-engagement moment for lapsed students.
 *
 * Returning after 2+ days away, students currently see the same Home flow
 * as always — no acknowledgment, no re-entry hook. This card replaces the
 * CompoundingCard slot for lapsed users with a journal-voice welcome.
 *
 * Design (per plan-design-review):
 *   - Headline NOT "Welcome back" (AI-slop blacklist #9). Pulls from the
 *     student's actual weak concept: "You left off on Linear Algebra."
 *   - Headline in white (relational, not AI/Plan, so no violet)
 *   - No left-border accent (avoid AI-slop pattern #8)
 *   - Per-day TTL via useDismissible
 *
 * Lapse detection (T7):
 *   - LAPSE_THRESHOLD_HOURS = 48 (exam-prep daily-habit; 2 missed days = at risk)
 *   - Account age guard: only show if user.created_at > 3 days ago AND
 *     (recent_attempts is empty OR latest is >48h old)
 *   - Empty-attempts case requires user has exam_id (completed onboard) —
 *     prevents firing for never-engaged old accounts
 *   - Dual field path: timestamp ?? attempted_at (per gbrain summary shape)
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDismissible } from '@/hooks/useDismissible';
import { trackEvent } from '@/lib/analytics';

interface GBrainSummary {
  user?: {
    exam_id?: string | null;
  };
  mastery?: {
    weak_concepts_preview?: Array<{ concept_id: string; score: number; attempts?: number }>;
  };
  recent_attempts?: Array<{ timestamp?: string; attempted_at?: string; concept_id?: string }>;
  exam_context?: {
    days_to_exam?: number;
  };
}

interface UserProfile {
  created_at?: string;
}

interface Props {
  /** Pre-fetched gbrain summary, or null if unavailable. */
  summary?: GBrainSummary | null;
  /** Pre-fetched user profile, or null if unavailable. */
  user?: UserProfile | null;
}

const LAPSE_THRESHOLD_HOURS = 48;
const ACCOUNT_AGE_THRESHOLD_HOURS = 72;

/**
 * Pick a topic name to surface in the welcome-back copy.
 * Returns null if no usable signal is present.
 */
function pickPickupTopic(summary: GBrainSummary | null | undefined): string | null {
  if (!summary) return null;
  // Prefer the latest attempted concept (the user was actively working on it)
  const latest = summary.recent_attempts?.[summary.recent_attempts.length - 1];
  if (latest?.concept_id) return prettify(latest.concept_id);
  // Fall back to the weakest concept
  const weak = summary.mastery?.weak_concepts_preview?.[0];
  if (weak?.concept_id) return prettify(weak.concept_id);
  return null;
}

function prettify(conceptId: string): string {
  // "linear-algebra" → "Linear Algebra"
  return conceptId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Compute lapse status. Returns:
 *   - { lapsed: false } if not lapsed (or insufficient data)
 *   - { lapsed: true, daysAway: N } if lapsed
 */
function computeLapse(
  summary: GBrainSummary | null | undefined,
  user: UserProfile | null | undefined,
): { lapsed: boolean; daysAway?: number } {
  if (!summary || !user?.created_at) return { lapsed: false };

  const accountAgeMs = Date.now() - Date.parse(user.created_at);
  if (!Number.isFinite(accountAgeMs)) return { lapsed: false };
  if (accountAgeMs < ACCOUNT_AGE_THRESHOLD_HOURS * 3600 * 1000) {
    // Brand-new account, never lapsed regardless of activity
    return { lapsed: false };
  }

  const attempts = summary.recent_attempts ?? [];
  if (attempts.length === 0) {
    // Old account, no attempts ever — only lapsed if onboarded
    if (!summary.user?.exam_id) return { lapsed: false };
    return { lapsed: true, daysAway: Math.floor(accountAgeMs / (24 * 3600 * 1000)) };
  }

  const latest = attempts[attempts.length - 1];
  const tsRaw = latest?.timestamp ?? latest?.attempted_at;
  if (!tsRaw) return { lapsed: false };
  const lastMs = Date.parse(tsRaw);
  if (!Number.isFinite(lastMs)) return { lapsed: false };

  const hoursSince = (Date.now() - lastMs) / (3600 * 1000);
  if (hoursSince < LAPSE_THRESHOLD_HOURS) return { lapsed: false };

  return {
    lapsed: true,
    daysAway: Math.max(2, Math.floor(hoursSince / 24)),
  };
}

export function WelcomeBackCard({ summary, user }: Props) {
  const lapse = useMemo(() => computeLapse(summary, user), [summary, user]);
  const topic = useMemo(() => pickPickupTopic(summary), [summary]);

  const { dismissed, dismiss } = useDismissible({
    key: 'vidhya.welcome_back.dismissed.v1',
    ttlHours: 24,
  });

  useEffect(() => {
    if (lapse.lapsed && !dismissed) {
      trackEvent('welcome_back_shown', {
        days_away: lapse.daysAway ?? 0,
        has_topic: !!topic,
      });
    }
  }, [lapse.lapsed, lapse.daysAway, topic, dismissed]);

  if (!lapse.lapsed || dismissed) return null;

  const headline = topic
    ? `${topic} is still here when you're ready.`
    : "Your plan's still here.";

  const subline = `It's been ${lapse.daysAway ?? 2} days. Nothing's changed but the date.`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-4"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="font-display text-lg font-semibold text-white leading-snug">
              {headline}
            </h2>
            <p className="text-xs text-surface-400">{subline}</p>
          </div>
          <button
            onClick={() => {
              trackEvent('welcome_back_dismissed', {});
              dismiss();
            }}
            className="shrink-0 p-1 -m-1 rounded hover:bg-surface-800 transition-colors"
            aria-label="Dismiss welcome-back card"
          >
            <X size={14} className="text-surface-500" />
          </button>
        </div>

        <Link
          to="/planned"
          onClick={() => trackEvent('welcome_back_clicked', { topic: topic ?? null })}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {topic ? `Resume ${topic}` : 'Resume your plan'} <ArrowRight size={13} />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

export const _testHelpers = {
  computeLapse,
  pickPickupTopic,
  LAPSE_THRESHOLD_HOURS,
  ACCOUNT_AGE_THRESHOLD_HOURS,
};
