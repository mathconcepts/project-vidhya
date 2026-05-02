/**
 * HoldoutPage — admin dashboard at /admin/holdout.
 *
 * Surfaces the Phase 1 holdout PYQ bank: stratified counts, 28-day
 * accuracy timeline, and per-PYQ listing. Read-only — the holdout bank
 * is seeded via scripts/seed-pyq-holdout.ts and the locked invariant
 * (PYQs never move post-seed) is enforced at the script level.
 *
 * Auth: admin role only. Falls back to a friendly gate for non-admins.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, Lock, RefreshCw, Database, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import {
  getHoldoutSummary,
  listHoldoutPyqs,
  type HoldoutSummary,
  type HoldoutPyqRow,
} from '@/api/admin/content-rd';

const EXAMS = ['gate-ma', 'jee-main'];

export default function HoldoutPage() {
  const { user, loading: authLoading } = useAuth();

  const [exam, setExam] = useState<string>('gate-ma');
  const [summary, setSummary] = useState<HoldoutSummary | null>(null);
  const [pyqs, setPyqs] = useState<HoldoutPyqRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (examId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        getHoldoutSummary(examId),
        listHoldoutPyqs(examId),
      ]);
      setSummary(s);
      setPyqs(p.pyqs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-holdout' });
    if (authLoading || !user) return;
    if (user.role !== 'admin') return;
    void load(exam);
  }, [authLoading, user, exam, load]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-violet-400" size={20} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-16 space-y-4">
        <Shield size={40} className="text-surface-700 mx-auto" />
        <h2 className="text-lg font-semibold text-surface-300">Admin access required</h2>
        <p className="text-xs text-surface-500">The Holdout dashboard is gated to admin accounts.</p>
      </div>
    );
  }

  // Aggregate accuracy across the timeline (single number for the headline KPI)
  const aggAttempts = summary?.timeline_28d.reduce((s, d) => s + d.attempts, 0) ?? 0;
  const aggCorrect = summary?.timeline_28d.reduce((s, d) => s + d.correct, 0) ?? 0;
  const aggAccuracy = aggAttempts > 0 ? aggCorrect / aggAttempts : null;

  return (
    <motion.div
      className="space-y-6 max-w-3xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.header variants={fadeInUp} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <Lock size={18} className="text-violet-400" />
            Holdout PYQ bank
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Reserved PYQs measured against the cohort. The locked invariant: a PYQ never moves between
            practice and holdout post-seed (would invalidate prior lift numbers).
          </p>
        </div>
        <button
          onClick={() => void load(exam)}
          disabled={loading}
          className="p-1.5 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200 disabled:opacity-50"
          aria-label="Refresh holdout data"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        </button>
      </motion.header>

      {error && (
        <motion.div
          variants={fadeInUp}
          className="rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300 p-3"
        >
          {error}
        </motion.div>
      )}

      {/* Exam picker */}
      <motion.div variants={fadeInUp} className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-surface-500 font-medium">Exam:</span>
        {EXAMS.map((id) => (
          <button
            key={id}
            onClick={() => setExam(id)}
            className={
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ' +
              (id === exam
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                : 'bg-surface-900 border-surface-800 text-surface-400 hover:text-surface-200')
            }
          >
            {id}
          </button>
        ))}
      </motion.div>

      {/* Headline KPIs */}
      {summary && (
        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3">
          <KpiCard
            icon={Database}
            label="Holdout PYQs"
            value={summary.total_holdout.toString()}
            sub={`${summary.stratification.length} (year × topic) buckets`}
          />
          <KpiCard
            icon={TrendingUp}
            label="28-day attempts"
            value={aggAttempts.toString()}
            sub={`${aggCorrect} correct`}
          />
          <KpiCard
            icon={TrendingUp}
            label="Cohort accuracy (28d)"
            value={aggAccuracy != null ? (aggAccuracy * 100).toFixed(1) + '%' : '—'}
            sub="on holdout bank"
          />
        </motion.div>
      )}

      {/* Stratification table */}
      {summary && summary.stratification.length > 0 && (
        <motion.section variants={fadeInUp} className="space-y-2">
          <h2 className="text-sm font-semibold text-surface-100">Stratification (year × topic)</h2>
          <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-surface-900 border-b border-surface-800">
                <tr className="text-left text-surface-500">
                  <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">Year</th>
                  <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">Topic</th>
                  <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.stratification.map((s, i) => (
                  <tr key={i} className="border-b border-surface-800 last:border-0">
                    <td className="px-3 py-2 font-mono text-surface-300">{s.year}</td>
                    <td className="px-3 py-2 text-surface-300">{s.topic}</td>
                    <td className="px-3 py-2 text-right font-mono text-surface-400">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* Per-PYQ listing — first 50 only */}
      {pyqs.length > 0 && (
        <motion.section variants={fadeInUp} className="space-y-2">
          <h2 className="text-sm font-semibold text-surface-100">Holdout PYQs ({pyqs.length})</h2>
          <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-900 border-b border-surface-800">
                  <tr className="text-left text-surface-500">
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">ID</th>
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">Year</th>
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">Topic</th>
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">Diff</th>
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide">Taught by</th>
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide text-right">Attempts</th>
                    <th className="px-3 py-2 font-medium text-[10px] uppercase tracking-wide text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {pyqs.slice(0, 50).map((p) => (
                    <tr key={p.id} className="border-b border-surface-800 last:border-0 hover:bg-surface-900/50">
                      <td className="px-3 py-2 font-mono text-[10px] text-surface-500">{p.id.slice(0, 12)}…</td>
                      <td className="px-3 py-2 font-mono text-surface-300">{p.year}</td>
                      <td className="px-3 py-2 text-surface-300">{p.topic}</td>
                      <td className="px-3 py-2 text-surface-400">{p.difficulty ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-surface-500">
                        {p.taught_by_unit_id ? p.taught_by_unit_id.slice(0, 16) + '…' : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-surface-400">{p.attempts}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {p.accuracy == null ? (
                          <span className="text-surface-600">—</span>
                        ) : (
                          <span className={p.accuracy >= 0.6 ? 'text-emerald-400' : p.accuracy >= 0.3 ? 'text-surface-300' : 'text-red-400'}>
                            {(p.accuracy * 100).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pyqs.length > 50 && (
              <div className="p-3 text-center text-[11px] text-surface-500 border-t border-surface-800">
                Showing first 50 of {pyqs.length}. (Pagination — add when bank &gt; 100/exam.)
              </div>
            )}
          </div>
        </motion.section>
      )}

      {summary && summary.total_holdout === 0 && (
        <motion.div variants={fadeInUp} className="rounded-xl bg-surface-900/50 border border-surface-800 p-6 text-center">
          <p className="text-sm text-surface-400">No holdout PYQs seeded for {exam} yet.</p>
          <p className="text-xs text-surface-500 mt-1 font-mono">npx tsx scripts/seed-pyq-holdout.ts --exam {exam}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-surface-500 font-medium">
        <Icon size={11} className="text-violet-400" />
        <span>{label}</span>
      </div>
      <div className="text-lg font-bold text-surface-100 font-mono">{value}</div>
      {sub && <div className="text-[10px] text-surface-500">{sub}</div>}
    </div>
  );
}
