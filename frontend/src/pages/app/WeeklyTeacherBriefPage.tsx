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
import { trackEvent } from '@/lib/analytics';
import { isDemoMode, isSeededRole, getDemoRole } from '@/lib/demoMode';
import { SampleDataChip } from '@/components/app/SampleDataChip';

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
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 32, width: '66%', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        <div style={{ height: 96, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        <div style={{ height: 96, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />
      </div>
    );
  }

  if (error === 'forbidden') {
    return (
      <div style={{ maxWidth: 448, margin: '0 auto', padding: '64px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Teachers only</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          The weekly brief is for users with the teacher role.
        </p>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div style={{ maxWidth: 448, margin: '0 auto', padding: '64px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Couldn't load brief</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{error || 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-caption)', color: 'var(--green-ink)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!brief.should_show) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 448, margin: '0 auto', padding: '64px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <Users size={32} style={{ color: 'var(--text-tertiary)' }} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>No cohort yet.</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          {brief.message || 'Invite students to your cohort to start seeing weekly insights.'}
        </p>
        <Link
          to="/teacher/roster"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--green-ink)', textDecoration: 'none' }}
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
          Week {brief.week}
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          This week with your cohort
          {isDemoMode() && isSeededRole(getDemoRole()) && <SampleDataChip />}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{brief.opening}</p>
      </header>

      {/* Cohort stats */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
            Cohort mastery
          </p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
            {masteryPct}<span style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>%</span>
          </p>
          {brief.cohort_delta_pct !== null && brief.cohort_delta_pct !== undefined && Math.abs(brief.cohort_delta_pct) >= 1 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: deltaPositive ? 'var(--green-ink)' : 'var(--orange)' }}>
              {deltaPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {deltaPositive ? '+' : ''}{brief.cohort_delta_pct} pts vs last week
            </p>
          )}
        </div>
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
            Students
          </p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{brief.cohort_size ?? 0}</p>
        </div>
      </section>

      {/* Top performer */}
      {brief.top_performer && (
        <section style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,199,89,.22)', background: 'rgba(52,199,89,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={14} style={{ color: 'var(--green-ink)' }} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green-ink)' }}>
              Top performer
            </p>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
            {brief.top_performer.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            {Math.round(brief.top_performer.mastery * 100)}% avg mastery
          </p>
        </section>
      )}

      {/* Struggling */}
      {brief.struggling_students && brief.struggling_students.length > 0 && (
        <section style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,149,0,.22)', background: 'rgba(255,149,0,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ color: 'var(--orange)' }} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--orange)' }}>
              Need a conversation ({brief.struggling_students.length})
            </p>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.struggling_students.map(s => (
              <li key={s.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {s.reason === 'inactive' ? 'inactive 3+ days' : 'mastery < 40%'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* One action */}
      {brief.one_action && (
        <section style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(88,86,214,.22)', background: 'rgba(88,86,214,.04)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--indigo-ink)' }}>
            This week
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', lineHeight: 1.6, color: 'var(--text-primary)' }}>{brief.one_action}</p>
        </section>
      )}
    </motion.div>
  );
}
