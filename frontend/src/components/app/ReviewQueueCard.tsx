/**
 * ReviewQueueCard — surfaces GBrain's retention + trajectory insights on
 * the student's planner.
 *
 * Two compact panels:
 *
 *   1. Retention queue  — concepts due for spaced review now, plus how
 *                         many concepts are coming up over the next 7 days.
 *                         Helps the student catch their own forgetting curve.
 *
 *   2. Performance signal — top trajectory insights (breakthrough / plateau /
 *                            decline / steady). Highlights what's moving
 *                            and what's stuck.
 *
 * Both panels read from /api/gbrain/retention/:sid and
 * /api/gbrain/trajectory/:sid. The card returns null when the student
 * has no tracked encounters yet (cold-start), so we don't show empty UI.
 */

import { useEffect, useState } from 'react';
import { authFetch, getToken } from '@/lib/auth/client';
import { clsx } from 'clsx';
import { Brain, Clock, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

/**
 * Lightweight JWT payload decode — no verification, just claim extraction.
 * The token is already trusted (came from our own auth flow); we just need
 * the user_id to call /api/gbrain/retention/:sid.
 */
function getCurrentUserId(): string | null {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = t.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.sub ?? decoded.user_id ?? decoded.uid ?? null;
  } catch { return null; }
}

interface RetentionItem {
  concept_id: string;
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  due_for_review_at: string;
  last_quality: number;
}

interface RetentionSnapshot {
  total_concepts_tracked: number;
  due_now: number;
  due_in_24h: number;
  due_in_7d: number;
  avg_ease_factor: number;
  stable_concepts: number;
  fragile_concepts: number;
}

type Pattern = 'plateau' | 'breakthrough' | 'decline' | 'steady' | 'cold-start';

interface ConceptTrajectory {
  concept_id: string;
  current_mastery: number;
  delta_30d: number;
  pattern: Pattern;
  insight: string;
}

export function ReviewQueueCard() {
  const [retention, setRetention] = useState<{ snapshot: RetentionSnapshot; due: RetentionItem[] } | null>(null);
  const [trajectories, setTrajectories] = useState<ConceptTrajectory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sid = getCurrentUserId();
    if (!sid) { setLoading(false); return; }

    Promise.all([
      authFetch(`/api/gbrain/retention/${sid}`),
      authFetch(`/api/gbrain/trajectory/${sid}`),
    ])
      .then(async ([rR, tR]) => {
        if (cancelled) return;
        if (rR.ok) {
          const d = await rR.json();
          setRetention({ snapshot: d.snapshot, due: d.due ?? [] });
        }
        if (tR.ok) {
          const d = await tR.json();
          setTrajectories(d.insights ?? []);
        }
      })
      .catch(() => { /* fail silently — this card is supplementary */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Hide when there's nothing useful to show (cold-start student)
  const hasRetention = !!retention && retention.snapshot.total_concepts_tracked > 0;
  const hasTrajectory = trajectories.length > 0;
  if (loading) return null;
  if (!hasRetention && !hasTrajectory) return null;

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-zinc-100">Your learning health</h3>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">GBrain</span>
      </div>

      {hasRetention && retention && (
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <h4 className="text-xs uppercase tracking-wide text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Review queue
            </h4>
            <span className="text-[10px] text-zinc-500">{retention.snapshot.total_concepts_tracked} concepts tracked</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <Stat label="Due now"      value={retention.snapshot.due_now}   tone={retention.snapshot.due_now > 0 ? 'warn' : 'mute'} />
            <Stat label="Next 24h"     value={retention.snapshot.due_in_24h} tone="info" />
            <Stat label="Next 7d"      value={retention.snapshot.due_in_7d}  tone="info" />
          </div>

          {retention.snapshot.due_now > 0 && retention.due.length > 0 && (
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2 space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Catch these first</div>
              {retention.due.slice(0, 3).map(item => (
                <div key={item.concept_id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-300">{item.concept_id}</span>
                  <span className="text-[10px] text-zinc-500">
                    rev #{item.repetitions} · ease {item.ease_factor.toFixed(1)}
                  </span>
                </div>
              ))}
              {retention.due.length > 3 && (
                <div className="text-[10px] text-zinc-500 italic">+ {retention.due.length - 3} more</div>
              )}
            </div>
          )}

          {retention.snapshot.fragile_concepts > 0 && (
            <div className="mt-2 text-[11px] text-amber-300/80">
              {retention.snapshot.fragile_concepts} concept{retention.snapshot.fragile_concepts === 1 ? '' : 's'} fragile —
              recent attempts weren't strong. Worth re-encountering before harder material.
            </div>
          )}
        </div>
      )}

      {hasTrajectory && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-zinc-400 flex items-center gap-1 mb-1.5">
            <ArrowUpRight className="w-3 h-3" /> Performance signal · last 30 days
          </h4>
          <div className="space-y-1.5">
            {trajectories.slice(0, 4).map(t => <TrajectoryRow key={t.concept_id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'mute' | 'warn' | 'info' }) {
  return (
    <div className={clsx(
      'rounded-lg px-2.5 py-1.5 border',
      tone === 'warn' && 'bg-amber-500/10 border-amber-500/30',
      tone === 'info' && 'bg-sky-500/10 border-sky-500/30',
      tone === 'mute' && 'bg-zinc-950 border-zinc-800',
    )}>
      <div className={clsx(
        'text-lg font-bold leading-tight',
        tone === 'warn' && 'text-amber-300',
        tone === 'info' && 'text-sky-300',
        tone === 'mute' && 'text-zinc-200',
      )}>{value}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}

function TrajectoryRow({ t }: { t: ConceptTrajectory }) {
  const Icon = t.pattern === 'breakthrough' ? TrendingUp
            : t.pattern === 'decline'      ? TrendingDown
            : Minus;
  const tone = t.pattern === 'breakthrough' ? 'text-emerald-300'
             : t.pattern === 'decline'      ? 'text-red-300'
             : t.pattern === 'plateau'      ? 'text-amber-300'
             : 'text-zinc-300';
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className={clsx('w-3.5 h-3.5 mt-0.5 shrink-0', tone)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-zinc-200">{t.concept_id}</span>
          <span className={clsx('text-[10px]', tone)}>
            {t.delta_30d >= 0 ? '+' : ''}{(t.delta_30d * 100).toFixed(0)}%
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">{t.insight.replace(`${t.concept_id}: `, '')}</div>
      </div>
    </div>
  );
}
