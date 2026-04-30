import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Activity, Target, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw,
  AlertCircle, Info, CheckCircle2, XCircle, Clock, Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

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
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!user) {
    return (
      <div className="p-6 text-surface-300">
        Sign in to view your learning history.
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-violet-400" />
          <div>
            <h1 className="text-2xl font-display font-semibold text-surface-50">
              {id ? `${data?.student_name ?? 'Student'}'s learning history` : 'Your learning history'}
            </h1>
            {/* v2.5: explicit "viewing as" indicator when viewing another
                student's history — makes the role-based access transparent
                to teachers and admins. */}
            {id && user?.role && (
              <p className="text-[11px] text-surface-500 uppercase tracking-wide mt-0.5">
                Viewing as {user.role}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Refresh</span>
        </button>
      </motion.div>

      <motion.div variants={fadeInUp} className="mb-6 p-4 rounded-lg bg-surface-900 border border-surface-700 flex gap-3">
        <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="text-sm text-surface-300 leading-relaxed">
          Each row below is a "turn" — one round of (you opened something → the system served something →
          you responded → the system observed and updated your mastery model). The summary below shows
          whether your mastery has been improving, flat, or declining across recent turns.
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="mb-6 p-4 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-rose-300 text-sm">{error}</div>
        </motion.div>
      )}

      {loading && !data && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-surface-500" />
        </motion.div>
      )}

      {data && (
        <>
          <SummaryCard summary={data.summary} />

          {data.turns.length === 0 ? (
            <motion.div variants={fadeInUp} className="text-center py-12 text-surface-500">
              No turns recorded yet. Try the chat tutor or work through a practice problem to start.
            </motion.div>
          ) : (
            <div className="space-y-3 mt-6">
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

  return (
    <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
        accentColor={summary.avg_mastery_delta_pct > 0 ? 'text-emerald-400'
                   : summary.avg_mastery_delta_pct < 0 ? 'text-rose-400'
                   : 'text-surface-300'}
      />
      <StatTile
        icon={TrendIcon}
        label="Trend"
        value={trend_meta.label}
        accentColor={trend_meta.color}
      />
    </motion.div>
  );
}

const TREND_META: Record<TurnsResponse['summary']['trend'], { icon: typeof TrendingUp; label: string; color: string }> = {
  improving:           { icon: TrendingUp,    label: 'Improving',         color: 'text-emerald-400' },
  flat:                { icon: Minus,         label: 'Flat',              color: 'text-amber-400' },
  declining:           { icon: TrendingDown,  label: 'Declining',         color: 'text-rose-400' },
  'insufficient-data': { icon: Info,          label: 'Need more data',    color: 'text-surface-300' },
};

function StatTile({ icon: Icon, label, value, sub, accentColor = 'text-surface-100' }: {
  icon: typeof Target;
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-surface-900 border border-surface-700">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={clsx('w-4 h-4', accentColor)} />
        <span className="text-xs text-surface-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className={clsx('text-2xl font-semibold', accentColor)}>{value}</div>
      {sub && <div className="text-xs text-surface-500 mt-1">{sub}</div>}
    </div>
  );
}

function TurnCard({ turn }: { turn: TeachingTurn }) {
  const ts = new Date(turn.initiated_at).toLocaleString();
  const correct = turn.attempt_outcome?.correct;
  const delta = turn.mastery_delta?.delta_pct;

  return (
    <motion.div
      variants={fadeInUp}
      className={clsx(
        'p-4 rounded-lg border',
        turn.status === 'open' ? 'bg-surface-900/50 border-surface-700 border-dashed'
                                : 'bg-surface-900 border-surface-700',
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-violet-900/30 text-violet-300 font-mono">
              {turn.intent}
            </span>
            {turn.routed_source && (
              <span className="text-xs px-2 py-0.5 rounded bg-surface-800 text-surface-400 font-mono">
                {turn.routed_source}
              </span>
            )}
            {turn.delivery_channel !== 'web' && (
              <span className="text-xs px-2 py-0.5 rounded bg-violet-900/30 text-violet-300 font-mono">
                {turn.delivery_channel}
              </span>
            )}
            {turn.degraded && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-900/30 text-amber-300">
                degraded: {turn.degraded.reason}
              </span>
            )}
            {turn.status === 'open' && (
              <span className="text-xs px-2 py-0.5 rounded bg-surface-800 text-surface-400">
                open
              </span>
            )}
          </div>
          <div className="text-sm text-surface-200 leading-relaxed">
            {turn.generated_content.summary}
          </div>
          {turn.pre_state.concept_id && (
            <div className="text-xs text-surface-500 mt-1">
              concept: <span className="font-mono">{turn.pre_state.concept_id}</span>
              {turn.pre_state.mastery_before !== null && (
                <> · mastery before: {(turn.pre_state.mastery_before * 100).toFixed(0)}%</>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-surface-400">
          <span>{ts}</span>
          {turn.duration_ms && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(turn.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {turn.attempt_outcome && (
        <div className="mt-3 pt-3 border-t border-surface-700/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            {correct ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span className={clsx(correct ? 'text-emerald-300' : 'text-rose-300')}>
              {correct ? 'correct' : 'incorrect'}
            </span>
          </div>
          {typeof delta === 'number' && (
            <div className={clsx(
              'text-sm font-medium',
              delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-surface-300',
            )}>
              {delta >= 0 ? '+' : ''}{delta}% mastery
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
