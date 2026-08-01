import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, Brain, RefreshCw, Loader2, UserCircle,
  TrendingDown, TrendingUp, Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { isDemoMode, isSeededRole, getDemoRole } from '@/lib/demoMode';
import { SampleDataChip } from '@/components/app/SampleDataChip';

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
      <div style={{ maxWidth: 448, margin: '0 auto', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={24} style={{ color: 'var(--orange)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>Teacher role required.</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 896, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={20} style={{ color: 'var(--green-ink)' }} />
            Your Students
            {isDemoMode() && isSeededRole(getDemoRole()) && <SampleDataChip />}
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            {data ? `${data.student_count} students` : 'Loading...'}
            {data && data.attention_count > 0 && (
              <> · <span style={{ color: 'var(--orange)' }}>{data.attention_count} need attention</span></>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 11, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
          <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />
          Loading student roster...
        </div>
      ) : data && data.students.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <UserCircle size={32} style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>No students assigned yet</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Ask your admin to assign students to you via <span style={{ fontFamily: 'var(--font-mono)' }}>/admin/users</span>
          </p>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.students.map(s => (
            <StudentRow key={s.student_id} student={s} />
          ))}
        </div>
      ) : null}

      {/* Info panel */}
      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.04)', border: '1px solid rgba(88,86,214,.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Brain size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--indigo-ink)' }} />
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--indigo-ink)' }}>About these summaries.</span>{' '}
          Each student's mastery is estimated from their answer history using a Bayesian cognitive model.
          Aggregate only — raw answers stay private to each student.
        </div>
      </div>
    </motion.div>
  );
}

function StudentRow({ student: s }: { student: RosterStudent }) {
  const masteryPct = Math.round(s.overall_mastery * 100);
  const masteryColor =
    masteryPct >= 70 ? 'var(--green-ink)'
    : masteryPct >= 40 ? 'var(--indigo-ink)'
    : 'var(--orange)';
  const barColor =
    masteryPct >= 70 ? 'var(--green)'
    : masteryPct >= 40 ? 'var(--indigo)'
    : 'var(--orange)';

  return (
    <div style={{
      padding: 12,
      borderRadius: 'var(--radius-md)',
      border: s.needs_attention ? '1px solid rgba(255,149,0,.25)' : 'var(--hairline) solid var(--separator)',
      background: s.needs_attention ? 'rgba(255,149,0,.04)' : 'var(--surface-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {s.picture ? (
          <img src={s.picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCircle size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</p>
        </div>
        {s.needs_attention && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--orange)', background: 'rgba(255,149,0,.08)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(255,149,0,.25)' }}>
            <AlertTriangle size={10} />
            attention
          </div>
        )}
      </div>

      {/* Mastery bar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Overall mastery</span>
          <span style={{ color: masteryColor }}>{masteryPct}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--surface-fill)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: barColor, width: `${masteryPct}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Concept breakdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, color: 'var(--text-tertiary)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={10} style={{ color: 'var(--green-ink)' }} />
          {s.concepts_mastered} mastered
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Activity size={10} style={{ color: 'var(--indigo-ink)' }} />
          {s.concepts_in_progress} in progress
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <TrendingDown size={10} style={{ color: 'var(--orange)' }} />
          {s.concepts_struggling} struggling
        </span>
      </div>

      {s.needs_attention && s.attention_reason && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--orange)', fontStyle: 'italic' }}>
          {s.attention_reason}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', paddingTop: 4 }}>
        <span>{s.total_attempts} total attempts</span>
        {s.last_active_at && (
          <span>last active {s.last_active_at.slice(0, 10)}</span>
        )}
      </div>
    </div>
  );
}
