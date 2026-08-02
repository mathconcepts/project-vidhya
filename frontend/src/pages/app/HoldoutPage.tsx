/**
 * HoldoutPage — admin dashboard at /admin/holdout.
 *
 * Surfaces the Phase 1 holdout PYQ bank: stratified counts, 28-day
 * accuracy timeline, and per-PYQ listing. Read-only — the holdout bank
 * is seeded via scripts/seed-pyq-holdout.ts and the locked invariant
 * (PYQs never move post-seed) is enforced at the script level.
 *
 * Auth: admin role only. Falls back to a friendly gate for non-admins.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, Lock, RefreshCw, Database, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import {
  getHoldoutSummary,
  listHoldoutPyqs,
  type HoldoutSummary,
  type HoldoutPyqRow,
} from '@/api/admin/content-rd';

const EXAMS = ['gate-ma', 'jee-main'];

export default function HoldoutPage() {
  const { user, loading: authLoading } = useAuth();

  const [exam, setExam] = useState<string>('gate-ma');
  const [summary, setSummary] = useState<HoldoutSummary | null>(null);
  const [pyqs, setPyqs] = useState<HoldoutPyqRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (examId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        getHoldoutSummary(examId),
        listHoldoutPyqs(examId),
      ]);
      setSummary(s);
      setPyqs(p.pyqs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-holdout' });
    if (authLoading || !user) return;
    if (user.role !== 'admin') return;
    void load(exam);
  }, [authLoading, user, exam, load]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Shield size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Admin access required</h2>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>The Holdout dashboard is gated to admin accounts.</p>
      </div>
    );
  }

  const aggAttempts = summary?.timeline_28d.reduce((s, d) => s + d.attempts, 0) ?? 0;
  const aggCorrect = summary?.timeline_28d.reduce((s, d) => s + d.correct, 0) ?? 0;
  const aggAccuracy = aggAttempts > 0 ? aggCorrect / aggAttempts : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 768, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} style={{ color: 'var(--indigo-ink)' }} />
            Holdout PYQ bank
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Reserved PYQs measured against the cohort. The locked invariant: a PYQ never moves between
            practice and holdout post-seed (would invalidate prior lift numbers).
          </p>
        </div>
        <button
          onClick={() => void load(exam)}
          disabled={loading}
          aria-label="Refresh holdout data"
          style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Exam picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-medium)' }}>Exam:</span>
        {EXAMS.map((id) => (
          <button
            key={id}
            onClick={() => setExam(id)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
              background: id === exam ? 'rgba(88,86,214,.08)' : 'var(--surface-fill)',
              border: id === exam ? '1px solid rgba(88,86,214,.3)' : 'var(--hairline) solid var(--separator)',
              color: id === exam ? 'var(--indigo-ink)' : 'var(--text-secondary)',
            }}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Headline KPIs */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <KpiCard
            icon={Database}
            label="Holdout PYQs"
            value={summary.total_holdout.toString()}
            sub={`${summary.stratification.length} (year × topic) buckets`}
          />
          <KpiCard
            icon={TrendingUp}
            label="28-day attempts"
            value={aggAttempts.toString()}
            sub={`${aggCorrect} correct`}
          />
          <KpiCard
            icon={TrendingUp}
            label="Cohort accuracy (28d)"
            value={aggAccuracy != null ? (aggAccuracy * 100).toFixed(1) + '%' : '—'}
            sub="on holdout bank"
          />
        </div>
      )}

      {/* Stratification table */}
      {summary && summary.stratification.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Stratification (year × topic)</h2>
          <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--surface-fill)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)' }}>Year</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)' }}>Topic</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.stratification.map((s, i) => (
                  <tr key={i} style={{ borderBottom: i < summary.stratification.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.year}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{s.topic}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Per-PYQ listing */}
      {pyqs.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Holdout PYQs ({pyqs.length})</h2>
          <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--surface-fill)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
                  <tr>
                    {['ID', 'Year', 'Topic', 'Diff', 'Taught by', 'Attempts', 'Accuracy'].map((h, idx) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: idx >= 5 ? 'right' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pyqs.slice(0, 50).map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < Math.min(pyqs.length, 50) - 1 ? 'var(--hairline) solid var(--separator)' : 'none' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>{p.id.slice(0, 12)}…</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{p.year}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{p.topic}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-tertiary)' }}>{p.difficulty ?? '—'}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {p.taught_by_unit_id ? p.taught_by_unit_id.slice(0, 16) + '…' : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{p.attempts}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {p.accuracy == null ? (
                          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        ) : (
                          <span style={{ color: p.accuracy >= 0.6 ? 'var(--green-ink)' : p.accuracy >= 0.3 ? 'var(--text-secondary)' : 'var(--red)' }}>
                            {(p.accuracy * 100).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pyqs.length > 50 && (
              <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', borderTop: 'var(--hairline) solid var(--separator)' }}>
                Showing first 50 of {pyqs.length}. (Pagination — add when bank &gt; 100/exam.)
              </div>
            )}
          </div>
        </section>
      )}

      {summary && summary.total_holdout === 0 && (
        <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', padding: 24, textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>No holdout PYQs seeded for {exam} yet.</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>npx tsx scripts/seed-pyq-holdout.ts --exam {exam}</p>
        </div>
      )}
    </motion.div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-medium)' }}>
        <Icon size={11} style={{ color: 'var(--indigo-ink)' }} />
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  );
}
