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
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-400" /></div>;
  }
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border border-surface-800 bg-surface-900 text-center">
        <Lock size={28} className="mx-auto text-surface-500 mb-3" />
        <p className="text-surface-200 font-medium mb-1">Admin only</p>
      </div>
    );
  }

  const next = progress?.milestones.find((m) => m.status === 'next');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-wider text-violet-400 mb-2">Admin journey</div>
        <h1 className="text-2xl font-display font-semibold text-surface-100">
          Welcome — let's get your cohort live.
        </h1>
        {progress && (
          <div className="mt-3 flex items-center gap-3 text-sm text-surface-400">
            <span className="text-surface-200 font-medium">{progress.done_count} of {progress.milestones.length} done</span>
            {next && (
              <>
                <span className="text-surface-600">·</span>
                <span>Next: <span className="text-violet-300">{next.label.toLowerCase()}</span></span>
              </>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="ml-auto inline-flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 disabled:opacity-50"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      {progress && (
        <ol className="relative">
          {/* The vertical connector line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-surface-800" aria-hidden="true" />

          {progress.milestones.map((m, idx) => (
            <MilestoneRow key={m.id} milestone={m} isLast={idx === progress.milestones.length - 1} />
          ))}
        </ol>
      )}

      {progress && progress.next_id === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-200 text-sm"
        >
          🎉 You've completed every milestone in the setup journey. From here on, the loop is weekly:
          read the digest, write 1 ruleset based on what won, watch the holdout timeline. See the{' '}
          <a className="text-emerald-300 underline" href="/docs/admin-guide-jee-tn.md#step-9--iterate" target="_blank" rel="noreferrer">
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

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative flex items-start gap-4 pl-0 pb-${isLast ? '0' : '6'}`}
    >
      {/* Status icon (sits on top of the connector line) */}
      <div className="relative z-10 mt-0.5 shrink-0">
        {isDone ? (
          <CheckCircle2 size={24} className="text-emerald-400 fill-emerald-500/15" />
        ) : isNext ? (
          <div className="w-6 h-6 rounded-full bg-violet-500/15 border-2 border-violet-400 flex items-center justify-center">
            <ArrowRight size={12} className="text-violet-300" />
          </div>
        ) : (
          <Circle size={24} className="text-surface-700" />
        )}
      </div>

      {/* Body */}
      <div className={`flex-1 min-w-0 p-4 rounded-xl border ${
        isNext ? 'border-violet-500/30 bg-violet-500/5'
          : isDone ? 'border-surface-800 bg-surface-900/50'
          : 'border-surface-800 bg-surface-900/30 opacity-70'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className={`text-sm font-medium ${isDone ? 'text-surface-200' : 'text-surface-100'}`}>
            {milestone.label}
          </h3>
          {isDone && milestone.count > milestone.threshold && (
            <span className="text-[10px] text-emerald-400 font-mono">{milestone.count}</span>
          )}
        </div>
        <p className={`text-xs ${isDone ? 'text-surface-500' : 'text-surface-400'} leading-relaxed mb-3`}>
          {milestone.description}
        </p>
        <div className="flex items-center gap-3">
          {isNext ? (
            <Link
              to={milestone.cta_href}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-violet-500 text-white hover:bg-violet-600"
            >
              {milestone.cta_label}
              <ArrowRight size={11} />
            </Link>
          ) : (
            <Link
              to={milestone.cta_href}
              className="text-xs text-surface-400 hover:text-surface-200"
            >
              {milestone.cta_label}
            </Link>
          )}
          <a
            href={milestone.doc_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-surface-500 hover:text-violet-300"
          >
            <BookOpen size={11} /> What is this?
          </a>
        </div>
      </div>
    </motion.li>
  );
}
