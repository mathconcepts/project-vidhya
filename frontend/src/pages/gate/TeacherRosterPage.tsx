import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, Brain, RefreshCw, Loader2, UserCircle,
  TrendingDown, TrendingUp, Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface RosterStudent {
  student_id: string;
  name: string;
  email: string;
  picture?: string;
  overall_mastery: number;
  concepts_mastered: number;
  concepts_in_progress: number;
  concepts_struggling: number;
  total_attempts: number;
  needs_attention: boolean;
  attention_reason: string | null;
  last_active_at: string | null;
}

interface RosterResponse {
  teacher: { id: string; name: string; email: string };
  student_count: number;
  attention_count: number;
  students: RosterStudent[];
}

export default function TeacherRosterPage() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<RosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/teacher/roster');
      if (r.status === 403) { setError('Teacher role required.'); return; }
      if (!r.ok) { setError(`HTTP ${r.status}`); return; }
      setData(await r.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (hasRole('teacher')) refresh(); else setLoading(false); }, [hasRole, refresh]);

  if (!hasRole('teacher')) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertTriangle size={24} className="text-amber-400 mx-auto" />
        <p className="text-sm text-surface-300">Teacher role required.</p>
        <p className="text-xs text-surface-500">Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            <Brain size={20} className="text-emerald-400" />
            Your Students
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            {data ? `${data.student_count} students` : 'Loading...'}
            {data && data.attention_count > 0 && (
              <> · <span className="text-amber-400">{data.attention_count} need attention</span></>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          {error}
        </motion.div>
      )}

      {loading && !data ? (
        <div className="text-center py-8 text-surface-500 text-sm">
          <Loader2 size={14} className="inline animate-spin mr-2" />
          Loading student roster...
        </div>
      ) : data && data.students.length === 0 ? (
        <motion.div variants={fadeInUp} className="p-6 rounded-xl bg-surface-900 border border-surface-800 text-center space-y-2">
          <UserCircle size={32} className="text-surface-600 mx-auto" />
          <p className="text-sm text-surface-300">No students assigned yet</p>
          <p className="text-xs text-surface-500">
            Ask your admin to assign students to you via <span className="font-mono">/admin/users</span>
          </p>
        </motion.div>
      ) : data ? (
        <motion.div variants={fadeInUp} className="space-y-2">
          {data.students.map(s => (
            <StudentRow key={s.student_id} student={s} />
          ))}
        </motion.div>
      ) : null}

      {/* Info panel */}
      <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 flex items-start gap-2.5">
        <Brain size={13} className="shrink-0 mt-0.5 text-violet-400" />
        <div className="text-[11px] text-violet-200/80 leading-relaxed">
          <span className="font-medium text-violet-300">About these summaries.</span>{' '}
          Each student's mastery is estimated from their answer history using a Bayesian cognitive model.
          Aggregate only — raw answers stay private to each student.
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================

function StudentRow({ student: s }: { student: RosterStudent }) {
  const masteryPct = Math.round(s.overall_mastery * 100);
  const masteryTone =
    masteryPct >= 70 ? 'text-emerald-400'
    : masteryPct >= 40 ? 'text-violet-400'
    : 'text-amber-400';

  return (
    <div className={clsx(
      'p-3 rounded-xl border space-y-2',
      s.needs_attention
        ? 'bg-amber-500/5 border-amber-500/30'
        : 'bg-surface-900 border-surface-800',
    )}>
      <div className="flex items-start gap-3">
        {s.picture ? (
          <img src={s.picture} alt="" className="w-9 h-9 rounded-full" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center">
            <UserCircle size={20} className="text-surface-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-100 truncate">{s.name}</p>
          <p className="text-[10px] text-surface-500 truncate">{s.email}</p>
        </div>
        {s.needs_attention && (
          <div className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
            <AlertTriangle size={10} />
            attention
          </div>
        )}
      </div>

      {/* Mastery bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-surface-500">Overall mastery</span>
          <span className={masteryTone}>{masteryPct}%</span>
        </div>
        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              masteryPct >= 70 ? 'bg-emerald-500'
              : masteryPct >= 40 ? 'bg-violet-500'
              : 'bg-amber-500',
            )}
            style={{ width: `${masteryPct}%` }}
          />
        </div>
      </div>

      {/* Concept breakdown */}
      <div className="flex items-center gap-4 text-[10px] text-surface-400">
        <span className="inline-flex items-center gap-1">
          <TrendingUp size={10} className="text-emerald-400" />
          {s.concepts_mastered} mastered
        </span>
        <span className="inline-flex items-center gap-1">
          <Activity size={10} className="text-violet-400" />
          {s.concepts_in_progress} in progress
        </span>
        <span className="inline-flex items-center gap-1">
          <TrendingDown size={10} className="text-amber-400" />
          {s.concepts_struggling} struggling
        </span>
      </div>

      {/* Attention reason */}
      {s.needs_attention && s.attention_reason && (
        <p className="text-[11px] text-amber-300 italic">
          {s.attention_reason}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-surface-600 pt-1">
        <span>{s.total_attempts} total attempts</span>
        {s.last_active_at && (
          <span>last active {s.last_active_at.slice(0, 10)}</span>
        )}
      </div>
    </div>
  );
}
