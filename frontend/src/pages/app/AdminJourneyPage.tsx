/**
 * AdminJourneyPage — vertical 8-stage progress dashboard at /admin/journey.
 *
 * The new admin landing surface. Each milestone is derived server-side
 * (see src/api/admin-journey-routes.ts); this page renders them as a
 * Vercel-style stacked list with a vertical connector line.
 *
 * Navigation philosophy: never gates anything. Power users can jump
 * anywhere via the existing top nav. The journey view exists to make
 * the workflow LEGIBLE, not enforced.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Lock, CheckCircle2, Circle, ArrowRight, RefreshCw, BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getJourneyProgress, type ProgressResponse, type Milestone } from '@/api/admin/journey';

export default function AdminJourneyPage() {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    try {
      setRefreshing(refresh);
      setError(null);
      const p = await getJourneyProgress({ refresh });
      setProgress(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    load(false);
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: 448, margin: '80px auto', padding: 24, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', textAlign: 'center' }}>
        <Lock size={28} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Admin only</p>
      </div>
    );
  }

  const next = progress?.milestones.find((m) => m.status === 'next');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 0' }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--indigo-ink)', marginBottom: 8 }}>Admin journey</div>
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Welcome — let's get your cohort live.
        </h1>
        {progress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>{progress.done_count} of {progress.milestones.length} done</span>
            {next && (
              <>
                <span>·</span>
                <span>Next: <span style={{ color: 'var(--indigo-ink)' }}>{next.label.toLowerCase()}</span></span>
              </>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.5 : 1, padding: 0 }}
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        )}
      </header>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {progress && (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
          {/* Vertical connector line */}
          <div style={{ position: 'absolute', left: 12, top: 8, bottom: 8, width: 1, background: 'var(--separator)' }} aria-hidden="true" />

          {progress.milestones.map((m, idx) => (
            <MilestoneRow key={m.id} milestone={m} isLast={idx === progress.milestones.length - 1} />
          ))}
        </ol>
      )}

      {progress && progress.next_id === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginTop: 32, padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,199,89,.22)', background: 'rgba(52,199,89,.06)', color: 'var(--green-ink)', fontSize: 'var(--text-caption)' }}
        >
          You've completed every milestone in the setup journey. From here on, the loop is weekly:
          read the digest, write 1 ruleset based on what won, watch the holdout timeline. See the{' '}
          <a style={{ color: 'var(--green-ink)', textDecoration: 'underline' }} href="/docs/admin-guide-jee-tn.md#step-9--iterate" target="_blank" rel="noreferrer">
            iteration guide
          </a>.
        </motion.div>
      )}
    </div>
  );
}

function MilestoneRow({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const isDone = milestone.status === 'done';
  const isNext = milestone.status === 'next';

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: 16,
    borderRadius: 'var(--radius-md)',
    border: isNext
      ? '1px solid rgba(88,86,214,.3)'
      : 'var(--hairline) solid var(--separator)',
    background: isNext
      ? 'rgba(88,86,214,.05)'
      : isDone
      ? 'var(--surface-card)'
      : 'var(--surface-fill)',
    opacity: !isDone && !isNext ? 0.7 : 1,
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: isLast ? 0 : 24, listStyle: 'none' }}
    >
      {/* Status icon */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 2, flexShrink: 0 }}>
        {isDone ? (
          <CheckCircle2 size={24} style={{ color: 'var(--green-ink)' }} />
        ) : isNext ? (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(88,86,214,.12)', border: '2px solid var(--indigo-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={12} style={{ color: 'var(--indigo-ink)' }} />
          </div>
        ) : (
          <Circle size={24} style={{ color: 'var(--separator)' }} />
        )}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
            {milestone.label}
          </h3>
          {isDone && milestone.count > milestone.threshold && (
            <span style={{ fontSize: 10, color: 'var(--green-ink)', fontFamily: 'var(--font-mono)' }}>{milestone.count}</span>
          )}
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 11, color: isDone ? 'var(--text-tertiary)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
          {milestone.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isNext ? (
            <Link
              to={milestone.cta_href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 'var(--weight-medium)', background: 'var(--indigo)', color: 'var(--text-on-accent)', textDecoration: 'none' }}
            >
              {milestone.cta_label}
              <ArrowRight size={11} />
            </Link>
          ) : (
            <Link
              to={milestone.cta_href}
              style={{ fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'none' }}
            >
              {milestone.cta_label}
            </Link>
          )}
          <a
            href={milestone.doc_link}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >
            <BookOpen size={11} /> What is this?
          </a>
        </div>
      </div>
    </motion.li>
  );
}
