/**
 * ReviewQueueCard — surfaces GBrain's retention + trajectory insights.
 */

import { useEffect, useState } from 'react';
import { authFetch, getToken } from '@/lib/auth/client';
import { Brain, Clock, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

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
      .catch(() => { /* fail silently */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const hasRetention = !!retention && retention.snapshot.total_concepts_tracked > 0;
  const hasTrajectory = trajectories.length > 0;
  if (loading) return null;
  if (!hasRetention && !hasTrajectory) return null;

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: 'var(--hairline) solid var(--separator)',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-raise)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={16} style={{ color: 'var(--indigo-ink)' }} />
        <h3 style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Your learning health</h3>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GBrain</span>
      </div>

      {hasRetention && retention && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <h4 style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Review queue
            </h4>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{retention.snapshot.total_concepts_tracked} concepts tracked</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <Stat label="Due now"  value={retention.snapshot.due_now}    tone={retention.snapshot.due_now > 0 ? 'warn' : 'mute'} />
            <Stat label="Next 24h" value={retention.snapshot.due_in_24h} tone="info" />
            <Stat label="Next 7d"  value={retention.snapshot.due_in_7d}  tone="info" />
          </div>

          {retention.snapshot.due_now > 0 && retention.due.length > 0 && (
            <div style={{ borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catch these first</div>
              {retention.due.slice(0, 3).map(item => (
                <div key={item.concept_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-caption)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.concept_id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    rev #{item.repetitions} · ease {item.ease_factor.toFixed(1)}
                  </span>
                </div>
              ))}
              {retention.due.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>+ {retention.due.length - 3} more</div>
              )}
            </div>
          )}

          {retention.snapshot.fragile_concepts > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--orange)' }}>
              {retention.snapshot.fragile_concepts} concept{retention.snapshot.fragile_concepts === 1 ? '' : 's'} fragile —
              recent attempts weren't strong. Worth re-encountering before harder material.
            </div>
          )}
        </div>
      )}

      {hasTrajectory && (
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowUpRight size={12} /> Performance signal · last 30 days
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {trajectories.slice(0, 4).map(t => <TrajectoryRow key={t.concept_id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'mute' | 'warn' | 'info' }) {
  const bg = tone === 'warn' ? 'rgba(255,159,10,.06)' : tone === 'info' ? 'rgba(88,86,214,.05)' : 'var(--surface-fill)';
  const border = tone === 'warn' ? '1px solid rgba(255,159,10,.22)' : tone === 'info' ? '1px solid rgba(88,86,214,.18)' : 'var(--hairline) solid var(--separator)';
  const color = tone === 'warn' ? 'var(--orange)' : tone === 'info' ? 'var(--indigo-ink)' : 'var(--text-primary)';
  return (
    <div style={{ borderRadius: 'var(--radius-sm)', padding: '6px 10px', background: bg, border }}>
      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}

function TrajectoryRow({ t }: { t: ConceptTrajectory }) {
  const Icon = t.pattern === 'breakthrough' ? TrendingUp
             : t.pattern === 'decline'       ? TrendingDown
             : Minus;
  const color = t.pattern === 'breakthrough' ? 'var(--green-ink)'
              : t.pattern === 'decline'       ? 'var(--red)'
              : t.pattern === 'plateau'       ? 'var(--orange)'
              : 'var(--text-secondary)';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 'var(--text-caption)' }}>
      <Icon size={14} style={{ marginTop: 2, flexShrink: 0, color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{t.concept_id}</span>
          <span style={{ fontSize: 10, color }}>
            {t.delta_30d >= 0 ? '+' : ''}{(t.delta_30d * 100).toFixed(0)}%
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.insight.replace(`${t.concept_id}: `, '')}</div>
      </div>
    </div>
  );
}
