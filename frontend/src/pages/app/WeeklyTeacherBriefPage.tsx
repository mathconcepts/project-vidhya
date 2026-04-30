/**
 * WeeklyTeacherBriefPage (v4.0) — Monday cohort summary for teachers.
 *
 * Students get a weekly digest. Teachers get this. The narrative answers
 * "is teaching through Vidhya actually helping my cohort?"
 *
 * Calls GET /api/teaching/weekly-brief which aggregates over teacher's
 * roster with Promise.all (Pf1) and snapshot-fingerprint delta (A2).
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp } from '@/lib/animations';
import { trackEvent } from '@/lib/analytics';

interface WeeklyBrief {
  should_show: boolean;
  reason?: string;
  message?: string;
  opening?: string;
  cohort_size?: number;
  cohort_avg_mastery?: number;
  cohort_delta_pct?: number | null;
  top_performer?: { id: string; name: string; mastery: number } | null;
  struggling_students?: Array<{ id: string; name: string; reason: 'inactive' | 'low_mastery' }>;
  one_action?: string;
  week?: string;
}

export default function WeeklyTeacherBriefPage() {
  const [brief, setBrief] = useState<WeeklyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('teacher_brief_opened', {});
    let cancelled = false;
    authFetch('/api/teaching/weekly-brief')
      .then(r => {
        if (r.status === 403) throw new Error('forbidden');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: WeeklyBrief) => {
        if (cancelled) return;
        setBrief(data);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-4 py-8">
        <div className="h-8 w-2/3 rounded bg-surface-800 animate-pulse" />
        <div className="h-24 rounded-2xl bg-surface-900 animate-pulse" />
        <div className="h-24 rounded-2xl bg-surface-900 animate-pulse" />
      </div>
    );
  }

  if (error === 'forbidden') {
    return (
      <div className="text-center py-16 space-y-3 max-w-md mx-auto px-4">
        <h1 className="font-display text-2xl font-bold text-white">Teachers only</h1>
        <p className="text-sm text-surface-400">
          The weekly brief is for users with the teacher role.
        </p>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="text-center py-16 space-y-3 max-w-md mx-auto px-4">
        <h1 className="font-display text-2xl font-bold text-white">Couldn't load brief</h1>
        <p className="text-sm text-surface-400">{error || 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state — no cohort yet (P5 design: empty states are features)
  if (!brief.should_show) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-4 py-16 text-center space-y-4"
      >
        <Users size={32} className="text-surface-600 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-white">No cohort yet.</h1>
        <p className="text-sm text-surface-400">
          {brief.message || 'Invite students to your cohort to start seeing weekly insights.'}
        </p>
        <Link
          to="/teacher/roster"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Manage roster <ArrowRight size={14} />
        </Link>
      </motion.div>
    );
  }

  const deltaPositive = (brief.cohort_delta_pct ?? 0) > 0;
  const masteryPct = Math.round((brief.cohort_avg_mastery ?? 0) * 100);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
    >
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
          Week {brief.week}
        </p>
        <h1 className="font-display text-3xl font-bold text-white">
          This week with your cohort
        </h1>
        <p className="text-sm text-surface-300 leading-relaxed">{brief.opening}</p>
      </header>

      {/* Cohort stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-surface-700 bg-surface-900 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-surface-500 mb-2">
            Cohort mastery
          </p>
          <p className="font-display text-3xl font-bold text-white">
            {masteryPct}<span className="text-base text-surface-500">%</span>
          </p>
          {brief.cohort_delta_pct !== null && brief.cohort_delta_pct !== undefined && Math.abs(brief.cohort_delta_pct) >= 1 && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${deltaPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {deltaPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {deltaPositive ? '+' : ''}{brief.cohort_delta_pct} pts vs last week
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-surface-700 bg-surface-900 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-surface-500 mb-2">
            Students
          </p>
          <p className="font-display text-3xl font-bold text-white">{brief.cohort_size ?? 0}</p>
        </div>
      </section>

      {/* Top performer */}
      {brief.top_performer && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Top performer
            </p>
          </div>
          <p className="text-base font-display font-semibold text-white">
            {brief.top_performer.name}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            {Math.round(brief.top_performer.mastery * 100)}% avg mastery
          </p>
        </section>
      )}

      {/* Struggling */}
      {brief.struggling_students && brief.struggling_students.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400">
              Need a conversation ({brief.struggling_students.length})
            </p>
          </div>
          <ul className="space-y-2">
            {brief.struggling_students.map(s => (
              <li key={s.id} className="flex items-start justify-between gap-3">
                <span className="text-sm text-surface-100">{s.name}</span>
                <span className="text-[11px] text-surface-500 shrink-0">
                  {s.reason === 'inactive' ? 'inactive 3+ days' : 'mastery < 40%'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* One action */}
      {brief.one_action && (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400 mb-2">
            This week
          </p>
          <p className="text-sm leading-relaxed text-surface-100">{brief.one_action}</p>
        </section>
      )}
    </motion.div>
  );
}
