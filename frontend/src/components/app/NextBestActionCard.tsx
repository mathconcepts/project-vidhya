/**
 * NextBestActionCard — Wave 7: the dominant "what should I do right now"
 * card at the top of the exam-shell home page (PlannedSessionPage, /planned).
 *
 * Fetches:
 *   GET /api/readiness/next-action?time_budget_min=N   → { action, reason? }
 *   GET /api/readiness/expected-score                  → { realized, potential, ratio, reason? }
 * (src/api/readiness-routes.ts, Wave 7)
 *
 * Both endpoints are honest about cold-start / DB-less state: when there's
 * nothing concrete to recommend yet, `next-action` returns a `diagnose`
 * action with no `objectId` and `reason: "building your baseline"`, and
 * `expected-score` returns zeros with the same reason. This card renders
 * that as an explicit "Building your baseline" empty state rather than a
 * fabricated recommendation or a blank card.
 *
 * CTA routing by Action.kind (src/core/interfaces.ts):
 *   'teach'              → /lesson/:concept_id            (action.nodeId)
 *   'practice' | 'retain' → /attempt/:objectId (Wave 10, when the action
 *                           carries a concrete objectId — server-graded)
 *                           else /smart-practice?topic=:nodeId
 *   'diagnose'           → /smart-practice                 (no node scoped yet)
 *
 * Styling follows WelcomeBackCard/ReviewQueueCard conventions on this same
 * page: rounded-2xl surface card, Tailwind `surface`/violet/emerald
 * palette, framer-motion fade-in, lucide-react icons. Uses `authFetch`
 * (the auth-aware fetch every other authenticated call on this page uses)
 * rather than the plain `fetch()` DailyCardsPage uses, since these
 * endpoints require a student-role JWT.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { Compass, ArrowRight, Sparkles, RefreshCw, BookOpen, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type ActionKind = 'diagnose' | 'teach' | 'practice' | 'retain';

interface Action {
  kind: ActionKind;
  objectId?: string;
  nodeId?: string;
  estMinutes: number;
  rationale: string;
  expectedGain: number;
}

interface NextActionResponse {
  action: Action | null;
  expected_score?: { realized: number; potential: number } | null;
  reason?: string;
}

interface ExpectedScoreResponse {
  realized: number;
  potential: number;
  ratio: number | null;
  reason?: string;
}

const KIND_META: Record<ActionKind, { icon: typeof Sparkles; label: string; color: string }> = {
  diagnose: { icon: Compass, label: 'Quick check-in', color: 'text-sky-400' },
  teach: { icon: BookOpen, label: 'Learn something new', color: 'text-violet-400' },
  practice: { icon: Sparkles, label: 'Practice', color: 'text-emerald-400' },
  retain: { icon: RefreshCw, label: 'Review', color: 'text-amber-400' },
};

function ctaFor(action: Action): { to: string; label: string } {
  if (action.kind === 'teach' && action.nodeId) {
    return { to: `/lesson/${encodeURIComponent(action.nodeId)}`, label: 'Start learning' };
  }
  if ((action.kind === 'practice' || action.kind === 'retain') && action.objectId) {
    // Wave 10: a concrete item → the server-graded attempt page.
    return { to: `/attempt/${encodeURIComponent(action.objectId)}`, label: 'Start now' };
  }
  if ((action.kind === 'practice' || action.kind === 'retain') && action.nodeId) {
    return { to: `/smart-practice?topic=${encodeURIComponent(action.nodeId)}`, label: 'Start now' };
  }
  return { to: '/smart-practice', label: 'Get started' };
}

export function NextBestActionCard() {
  const [next, setNext] = useState<NextActionResponse | null>(null);
  const [score, setScore] = useState<ExpectedScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      authFetch('/api/readiness/next-action?time_budget_min=15').then(r => (r.ok ? r.json() : null)),
      authFetch('/api/readiness/expected-score').then(r => (r.ok ? r.json() : null)),
    ])
      .then(([nextData, scoreData]) => {
        if (cancelled) return;
        setNext(nextData);
        setScore(scoreData);
      })
      .catch(() => {
        // Supplementary card — fail silently into the empty state rather
        // than blocking the rest of the page.
        if (!cancelled) { setNext(null); setScore(null); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface-900 border border-surface-800 p-4 flex items-center gap-2 text-sm text-surface-400">
        <Loader2 size={14} className="animate-spin" /> Finding your next best action…
      </div>
    );
  }

  const action = next?.action ?? null;
  const isBuildingBaseline = !action || (action.kind === 'diagnose' && !action.objectId);

  const readinessLine = (() => {
    if (!score || score.reason || score.potential <= 0) return null;
    const lo = Math.round(score.realized);
    const hi = Math.round(score.potential);
    return `Estimated ${lo}–${hi} marks right now`;
  })();

  if (isBuildingBaseline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl bg-surface-900 border border-surface-800 p-4"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Compass size={16} className="text-sky-400" />
          <h2 className="font-display text-base font-semibold text-white">Next best action</h2>
        </div>
        <p className="text-sm text-surface-400">
          Building your baseline — answer a few questions to unlock this.
        </p>
        <Link
          to="/smart-practice"
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
        >
          Answer a few questions <ArrowRight size={14} />
        </Link>
      </motion.div>
    );
  }

  const meta = KIND_META[action!.kind];
  const Icon = meta.icon;
  const cta = ctaFor(action!);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl bg-surface-900 border border-surface-800 p-4"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={16} className={meta.color} />
        <h2 className="font-display text-base font-semibold text-white">Next best action</h2>
        <span className={clsx('text-[10px] uppercase tracking-wider ml-auto', meta.color)}>
          {meta.label}
        </span>
      </div>

      <p className="text-sm text-surface-300 leading-snug">{action!.rationale}</p>

      <div className="flex items-center justify-between mt-3 gap-3">
        <Link
          to={cta.to}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
        >
          {cta.label} <ArrowRight size={14} />
        </Link>
        <span className="text-xs text-surface-500 shrink-0">~{action!.estMinutes} min</span>
      </div>

      {readinessLine && (
        <div className="mt-3 pt-3 border-t border-surface-800 text-xs text-surface-400">
          {readinessLine}
        </div>
      )}
    </motion.div>
  );
}
