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
import { isAdminRole } from '@/lib/auth/roles';
import {
  getCohortAttention,
  type CohortAttentionResponse, type AttentionCard, type AttentionReason,
} from '@/api/admin/cohort';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

const REASON_META: Record<AttentionReason, { label: string; icon: typeof AlertTriangle; color: string }> = {
  frequent_regen:          { label: 'Frequent regen',       icon: RotateCw,     color: 'var(--orange)' },
  declining_mastery:       { label: 'Declining mastery',    icon: TrendingDown, color: 'var(--red)' },
  frustrated_or_flagging:  { label: 'Frustrated/flagging',  icon: Frown,        color: 'var(--orange)' },
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
    if (authLoading || !user || !isAdminRole(user.role)) return;
    load();
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }
  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ maxWidth: 448, margin: '80px auto', padding: 24, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', textAlign: 'center' }}>
        <Lock size={28} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Admin only</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 0' }}>
      <JourneyNudge currentHref="/admin/cohort" />

      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--indigo-ink)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              <Users size={14} /> Cohort attention
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
              Who needs you this week
            </h1>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              The deliberately small list of students whose data says they're stuck. Healthy students are rolled up — no
              individual call-outs by design.
            </p>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: refreshing ? 'not-allowed' : 'pointer', padding: 0 }}
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>{error}</div>
      )}

      {data && (
        <>
          {/* Needs attention */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--red)' }}>Needs attention</h2>
            {data.needs_attention.length === 0 ? (
              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,199,89,.22)', background: 'rgba(52,199,89,.06)', fontSize: 'var(--text-caption)', color: 'var(--green-ink)' }}>
                Nobody needs intervention right now. Quiet weeks are real wins — the system is working.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.needs_attention.map((card) => (
                  <CohortCard key={card.session_id} card={card} />
                ))}
                {data.cap_reached && (
                  <li style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '8px 12px' }}>
                    Cap of 10 reached. More students may need attention; address these first, then refresh to see the next batch.
                  </li>
                )}
              </ul>
            )}
          </section>

          {/* On track */}
          <section>
            <h2 style={{ margin: '0 0 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-ink)' }}>On track</h2>
            <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 'var(--text-caption)' }}>
                <TrendingUp size={14} style={{ color: 'var(--green-ink)' }} />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{data.on_track.progressing_normally}</strong> of{' '}
                  {data.on_track.total_active_students} students progressing normally
                  {data.on_track.mastered_this_week > 0 && (
                    <span style={{ color: 'var(--green-ink)' }}> — {data.on_track.mastered_this_week} mastered new ground this week</span>
                  )}.
                </span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
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
      style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.2)', background: 'rgba(255,59,48,.04)', listStyle: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
          session: <span style={{ color: 'var(--text-primary)' }}>{card.session_id.slice(0, 18)}…</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
          {card.motivation_state && <span>motivation: <span style={{ color: 'var(--text-secondary)' }}>{card.motivation_state}</span></span>}
          <span>·</span>
          <span>14d Δ: <span style={{ color: card.mastery_trajectory_14d < 0 ? 'var(--red)' : 'var(--green-ink)' }}>
            {card.mastery_trajectory_14d >= 0 ? '+' : ''}{card.mastery_trajectory_14d.toFixed(2)}
          </span></span>
          {card.recent_regen_count > 0 && (
            <>
              <span>·</span>
              <span>regens (7d): <span style={{ color: 'var(--orange)' }}>{card.recent_regen_count}</span></span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {card.reasons.map((r) => {
          const meta = REASON_META[r];
          const Icon = meta.icon;
          return (
            <span
              key={r}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 4, border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}
            >
              <Icon size={11} style={{ color: meta.color }} />
              {meta.label}
            </span>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>
          Run audit: <code style={{ color: 'var(--indigo-ink)' }}>npx tsx src/gbrain/operations/student-audit.ts {card.session_id.slice(0, 8)}…</code>
        </span>
      </div>
    </motion.li>
  );
}
