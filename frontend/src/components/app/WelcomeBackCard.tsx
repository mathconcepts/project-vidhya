/**
 * WelcomeBackCard (v4.0) — re-engagement moment for lapsed students.
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
  summary?: GBrainSummary | null;
  user?: UserProfile | null;
}

const LAPSE_THRESHOLD_HOURS = 48;
const ACCOUNT_AGE_THRESHOLD_HOURS = 72;

function pickPickupTopic(summary: GBrainSummary | null | undefined): string | null {
  if (!summary) return null;
  const latest = summary.recent_attempts?.[summary.recent_attempts.length - 1];
  if (latest?.concept_id) return prettify(latest.concept_id);
  const weak = summary.mastery?.weak_concepts_preview?.[0];
  if (weak?.concept_id) return prettify(weak.concept_id);
  return null;
}

function prettify(conceptId: string): string {
  return conceptId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function computeLapse(
  summary: GBrainSummary | null | undefined,
  user: UserProfile | null | undefined,
): { lapsed: boolean; daysAway?: number } {
  if (!summary || !user?.created_at) return { lapsed: false };

  const accountAgeMs = Date.now() - Date.parse(user.created_at);
  if (!Number.isFinite(accountAgeMs)) return { lapsed: false };
  if (accountAgeMs < ACCOUNT_AGE_THRESHOLD_HOURS * 3600 * 1000) {
    return { lapsed: false };
  }

  const attempts = summary.recent_attempts ?? [];
  if (attempts.length === 0) {
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
        style={{
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: 'var(--hairline) solid var(--separator)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-raise)',
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {headline}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{subline}</p>
          </div>
          <button
            onClick={() => {
              trackEvent('welcome_back_dismissed', {});
              dismiss();
            }}
            style={{ flexShrink: 0, padding: 4, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss welcome-back card"
          >
            <X size={14} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        <Link
          to="/planned"
          onClick={() => trackEvent('welcome_back_clicked', { topic: topic ?? null })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 'var(--text-body)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--green-ink)',
            textDecoration: 'none',
          }}
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
