/**
 * AdminCohortPage — the cohort attention surface at /admin/cohort.
 *
 * The deliberately-narrow alternative to "show me every student". By
 * default surfaces ONLY the (max 10) students who need attention, plus
 * a single celebratory line for everyone else. The whole-roster view
 * lives separately at /admin/users.
 *
 * Surveillance discipline: the on-track summary is counts only; the
 * attention cards carry session_id + motivation + trajectory + regen
 * count, never names / emails / per-attempt content.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Lock, RefreshCw, AlertTriangle, Users, TrendingUp, TrendingDown, RotateCw, Frown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCohortAttention,
  type CohortAttentionResponse, type AttentionCard, type AttentionReason,
} from '@/api/admin/cohort';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

const REASON_META: Record<AttentionReason, { label: string; icon: typeof AlertTriangle; color: string }> = {
  frequent_regen:        { label: 'Frequent regen',        icon: RotateCw,      color: 'text-amber-300' },
  declining_mastery:     { label: 'Declining mastery',     icon: TrendingDown,  color: 'text-rose-300' },
  frustrated_or_flagging: { label: 'Frustrated/flagging',  icon: Frown,         color: 'text-orange-300' },
};

export default function AdminCohortPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<CohortAttentionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true); setError(null);
    try { setData(await getCohortAttention()); }
    catch (e) { setError((e as Error).message); }
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    load();
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <JourneyNudge currentHref="/admin/cohort" />

      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs uppercase tracking-wider mb-2">
              <Users size={14} /> Cohort attention
            </div>
            <h1 className="text-2xl font-display font-semibold text-surface-100">
              Who needs you this week
            </h1>
            <p className="text-sm text-surface-400 mt-1">
              The deliberately small list of students whose data says they're stuck. Healthy students are rolled up — no
              individual call-outs by design.
            </p>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      )}

      {data && (
        <>
          {/* Needs attention */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-rose-300 mb-3">Needs attention</h2>
            {data.needs_attention.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-200">
                Nobody needs intervention right now. Quiet weeks are real wins — the system is working.
              </div>
            ) : (
              <ul className="space-y-2">
                {data.needs_attention.map((card) => (
                  <CohortCard key={card.session_id} card={card} />
                ))}
                {data.cap_reached && (
                  <li className="text-xs text-surface-500 px-3 py-2">
                    Cap of 10 reached. More students may need attention; address these first, then refresh to see the next batch.
                  </li>
                )}
              </ul>
            )}
          </section>

          {/* On track */}
          <section>
            <h2 className="text-xs uppercase tracking-wider text-emerald-300 mb-3">On track</h2>
            <div className="p-4 rounded-xl border border-surface-800 bg-surface-900">
              <div className="flex items-center gap-2 text-surface-200 text-sm">
                <TrendingUp size={14} className="text-emerald-400" />
                <span>
                  <strong className="text-surface-100">{data.on_track.progressing_normally}</strong> of{' '}
                  {data.on_track.total_active_students} students progressing normally
                  {data.on_track.mastered_this_week > 0 && (
                    <span className="text-emerald-300"> — {data.on_track.mastered_this_week} mastered new ground this week</span>
                  )}.
                </span>
              </div>
              <p className="text-xs text-surface-500 mt-2">
                No individual call-outs by design. Vidhya refuses to surveil students who are doing fine.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CohortCard({ card }: { card: AttentionCard }) {
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="font-mono text-[11px] text-surface-300">
          session: <span className="text-surface-200">{card.session_id.slice(0, 18)}…</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-surface-400">
          {card.motivation_state && <span>motivation: <span className="text-surface-300">{card.motivation_state}</span></span>}
          <span>·</span>
          <span>14d Δ: <span className={card.mastery_trajectory_14d < 0 ? 'text-rose-300' : 'text-emerald-300'}>
            {card.mastery_trajectory_14d >= 0 ? '+' : ''}{card.mastery_trajectory_14d.toFixed(2)}
          </span></span>
          {card.recent_regen_count > 0 && (
            <>
              <span>·</span>
              <span>regens (7d): <span className="text-amber-300">{card.recent_regen_count}</span></span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {card.reasons.map((r) => {
          const meta = REASON_META[r];
          const Icon = meta.icon;
          return (
            <span
              key={r}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-surface-800 bg-surface-900"
            >
              <Icon size={11} className={meta.color} />
              {meta.label}
            </span>
          );
        })}
        <span className="ml-auto text-[11px] text-surface-500">
          Run audit: <code className="text-violet-300">npx tsx src/gbrain/operations/student-audit.ts {card.session_id.slice(0, 8)}…</code>
        </span>
      </div>
    </motion.li>
  );
}
