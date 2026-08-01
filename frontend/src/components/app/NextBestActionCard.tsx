/**
 * NextBestActionCard — Wave 7: the dominant "what should I do right now"
 * card at the top of the exam-shell home page (PlannedSessionPage, /planned).
 *
 * Fetches:
 *   GET /api/readiness/next-action?time_budget_min=N   → { action, reason? }
 *   GET /api/readiness/expected-score                  → { realized, potential, ratio, reason? }
 * (src/api/readiness-routes.ts, Wave 7)
 *
 * CTA routing by Action.kind (src/core/interfaces.ts):
 *   'teach'              → /lesson/:concept_id            (action.nodeId)
 *   'practice' | 'retain' → /attempt/:objectId (Wave 10, when the action
 *                           carries a concrete objectId — server-graded)
 *                           else /smart-practice?topic=:nodeId
 *   'diagnose'           → /smart-practice                 (no node scoped yet)
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { Compass, ArrowRight, Sparkles, RefreshCw, BookOpen, Loader2 } from 'lucide-react';

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
  diagnose: { icon: Compass,    label: 'Quick check-in',      color: 'var(--text-secondary)' },
  teach:    { icon: BookOpen,   label: 'Learn something new', color: 'var(--indigo-ink)' },
  practice: { icon: Sparkles,   label: 'Practice',            color: 'var(--green-ink)' },
  retain:   { icon: RefreshCw,  label: 'Review',              color: 'var(--orange)' },
};

function ctaFor(action: Action): { to: string; label: string } {
  if (action.kind === 'teach' && action.nodeId) {
    return { to: `/lesson/${encodeURIComponent(action.nodeId)}`, label: 'Start learning' };
  }
  if ((action.kind === 'practice' || action.kind === 'retain') && action.objectId) {
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
        if (!cancelled) { setNext(null); setScore(null); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const cardStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-md)',
    border: 'var(--hairline) solid var(--separator)',
    background: 'var(--surface-card)',
    boxShadow: 'var(--shadow-raise)',
    padding: 16,
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
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
        style={cardStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Compass size={16} style={{ color: 'var(--text-secondary)' }} />
          <h2 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Next best action</h2>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Building your baseline — answer a few questions to unlock this.
        </p>
        <Link
          to="/smart-practice"
          style={{
            marginTop: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--indigo)',
            color: '#fff',
            fontSize: 'var(--text-caption)',
            fontWeight: 'var(--weight-semibold)',
            textDecoration: 'none',
          }}
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
      style={cardStyle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon size={16} style={{ color: meta.color }} />
        <h2 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Next best action</h2>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 'auto', color: meta.color }}>
          {meta.label}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{action!.rationale}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12 }}>
        <Link
          to={cta.to}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--indigo)',
            color: '#fff',
            fontSize: 'var(--text-caption)',
            fontWeight: 'var(--weight-semibold)',
            textDecoration: 'none',
          }}
        >
          {cta.label} <ArrowRight size={14} />
        </Link>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', flexShrink: 0 }}>~{action!.estMinutes} min</span>
      </div>

      {readinessLine && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          {readinessLine}
        </div>
      )}
    </motion.div>
  );
}
