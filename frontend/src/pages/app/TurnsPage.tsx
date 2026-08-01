import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Activity, Target, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw,
  AlertCircle, Info, CheckCircle2, XCircle, Clock, Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

/**
 * /gate/turns           — current student's own turn history
 * /gate/turns/:id       — admin/teacher/parent: another student's history
 *
 * Renders the teaching-turn record from /api/turns/me or
 * /api/turns/student/:id. Each turn shows: pre-state, what got
 * served, what happened, mastery delta. The summary roll-up at
 * top answers "am I getting better?".
 */

interface MasterySnapshot {
  concept_id: string | null;
  topic: string | null;
  mastery_before: number | null;
  attempts_so_far: number | null;
  zpd_concept: string | null;
}

interface TeachingTurn {
  turn_id: string;
  student_id: string;
  initiated_at: string;
  closed_at?: string;
  status: 'open' | 'closed';
  intent: string;
  delivery_channel: string;
  routed_source: string | null;
  generated_content: { type: string; summary: string };
  pre_state: MasterySnapshot;
  degraded?: { reason: string; detail: string };
  attempt_outcome?: { correct: boolean; response_time_ms: number };
  mastery_delta?: { before: number; after: number; delta_pct: number };
  duration_ms?: number;
}

interface TurnsResponse {
  student_id: string;
  student_name?: string;
  summary: {
    total_turns: number;
    closed_turns: number;
    total_attempts: number;
    correct_attempts: number;
    avg_mastery_delta_pct: number;
    trend: 'improving' | 'flat' | 'declining' | 'insufficient-data';
  };
  turns: TeachingTurn[];
}

const TREND_META: Record<TurnsResponse['summary']['trend'], { icon: typeof TrendingUp; label: string; color: string }> = {
  improving:           { icon: TrendingUp,   label: 'Improving',      color: 'var(--green-ink)' },
  flat:                { icon: Minus,        label: 'Flat',           color: 'var(--orange)' },
  declining:           { icon: TrendingDown, label: 'Declining',      color: 'var(--red)' },
  'insufficient-data': { icon: Info,         label: 'Need more data', color: 'var(--text-tertiary)' },
};

export default function TurnsPage() {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<TurnsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = id ? `/api/turns/student/${id}` : '/api/turns/me';
      const r = await authFetch(url);
      if (r.status === 401) {
        setError('Sign in to view your learning history.');
        setData(null);
        return;
      }
      if (r.status === 403) {
        const body = await r.json().catch(() => ({}));
        setError(body.error ?? 'Access denied.');
        setData(null);
        return;
      }
      if (!r.ok) {
        setError(`Failed to load turns: HTTP ${r.status}`);
        setData(null);
        return;
      }
      setData(await r.json());
    } catch (e: unknown) {
      setError(`Network error: ${e instanceof Error ? e.message : 'unknown'}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!user) {
    return (
      <div style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
        Sign in to view your learning history.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 896, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity size={20} style={{ color: 'var(--indigo-ink)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
              {id ? `${data?.student_name ?? 'Student'}'s learning history` : 'Your learning history'}
            </h1>
            {id && user?.role && (
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                Viewing as {user.role}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>Refresh</span>
        </button>
      </div>

      {/* Info box */}
      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.06)', border: '1px solid rgba(88,86,214,.22)', display: 'flex', gap: 10 }}>
        <Info size={16} style={{ color: 'var(--indigo-ink)', flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Each row below is a "turn" — one round of (you opened something → the system served something →
          you responded → the system observed and updated your mastery model). The summary below shows
          whether your mastery has been improving, flat, or declining across recent turns.
        </p>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--red)' }}>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      )}

      {data && (
        <>
          <SummaryCard summary={data.summary} />

          {data.turns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              No turns recorded yet. Try the chat tutor or work through a practice problem to start.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.turns.map(turn => <TurnCard key={turn.turn_id} turn={turn} />)}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function SummaryCard({ summary }: { summary: TurnsResponse['summary'] }) {
  const trend_meta = TREND_META[summary.trend];
  const TrendIcon = trend_meta.icon;
  const accuracy_pct = summary.total_attempts > 0
    ? Math.round((summary.correct_attempts / summary.total_attempts) * 100)
    : null;

  const deltaColor = summary.avg_mastery_delta_pct > 0 ? 'var(--green-ink)'
                   : summary.avg_mastery_delta_pct < 0 ? 'var(--red)'
                   : 'var(--text-secondary)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      <StatTile
        icon={Target}
        label="Total turns"
        value={summary.total_turns.toString()}
        sub={`${summary.closed_turns} closed`}
      />
      <StatTile
        icon={CheckCircle2}
        label="Accuracy"
        value={accuracy_pct !== null ? `${accuracy_pct}%` : '—'}
        sub={`${summary.correct_attempts}/${summary.total_attempts}`}
      />
      <StatTile
        icon={Zap}
        label="Avg Δ mastery"
        value={summary.avg_mastery_delta_pct >= 0
          ? `+${summary.avg_mastery_delta_pct}%`
          : `${summary.avg_mastery_delta_pct}%`}
        sub="per turn"
        accentColor={deltaColor}
      />
      <StatTile
        icon={TrendIcon}
        label="Trend"
        value={trend_meta.label}
        accentColor={trend_meta.color}
      />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, accentColor = 'var(--text-primary)' }: {
  icon: typeof Target;
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}) {
  return (
    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} style={{ color: accentColor }} />
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 'var(--weight-semibold)', color: accentColor, fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TurnCard({ turn }: { turn: TeachingTurn }) {
  const ts = new Date(turn.initiated_at).toLocaleString();
  const correct = turn.attempt_outcome?.correct;
  const delta = turn.mastery_delta?.delta_pct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
        borderColor: 'var(--separator)',
        borderWidth: 1,
        borderStyle: turn.status === 'open' ? 'dashed' : 'solid',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.1)', color: 'var(--indigo-ink)', fontFamily: 'var(--font-mono)' }}>
              {turn.intent}
            </span>
            {turn.routed_source && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {turn.routed_source}
              </span>
            )}
            {turn.delivery_channel !== 'web' && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.1)', color: 'var(--indigo-ink)', fontFamily: 'var(--font-mono)' }}>
                {turn.delivery_channel}
              </span>
            )}
            {turn.degraded && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,149,0,.08)', color: 'var(--orange)' }}>
                degraded: {turn.degraded.reason}
              </span>
            )}
            {turn.status === 'open' && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', color: 'var(--text-tertiary)' }}>
                open
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {turn.generated_content.summary}
          </div>
          {turn.pre_state.concept_id && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              concept: <span style={{ fontFamily: 'var(--font-mono)' }}>{turn.pre_state.concept_id}</span>
              {turn.pre_state.mastery_before !== null && (
                <> · mastery before: {(turn.pre_state.mastery_before * 100).toFixed(0)}%</>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span>{ts}</span>
          {turn.duration_ms && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {(turn.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {turn.attempt_outcome && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: 'var(--hairline) solid var(--separator)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)' }}>
            {correct ? (
              <CheckCircle2 size={14} style={{ color: 'var(--green-ink)' }} />
            ) : (
              <XCircle size={14} style={{ color: 'var(--red)' }} />
            )}
            <span style={{ color: correct ? 'var(--green-ink)' : 'var(--red)' }}>
              {correct ? 'correct' : 'incorrect'}
            </span>
          </div>
          {typeof delta === 'number' && (
            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: delta > 0 ? 'var(--green-ink)' : delta < 0 ? 'var(--red)' : 'var(--text-secondary)' }}>
              {delta >= 0 ? '+' : ''}{delta}% mastery
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
