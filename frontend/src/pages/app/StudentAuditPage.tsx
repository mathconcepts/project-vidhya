/**
 * StudentAuditPage — 360° analysis of a student powered by GBrain.
 *
 * Shows: executive summary, mastery heatmap, error analysis, prerequisite alerts,
 * cognitive profile, motivation, strategic recommendations, and 3-session action plan.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import {
  Target, TrendingUp, Brain, AlertTriangle, Lightbulb, Flame,
  BookOpen, Clock, Sparkles,
} from 'lucide-react';

interface AuditReport {
  session_id: string;
  generated_at: string;
  executive_summary: {
    predicted_score_range: string;
    readiness_level: 'not-ready' | 'building' | 'ready' | 'confident';
    biggest_risk: string;
    top_strength: string;
  };
  mastery_heatmap: Array<{
    topic: string; label: string; mastery: number; weight: number;
    expected_marks_contribution: number; trend: string;
  }>;
  error_analysis: {
    total_errors: number;
    dominant_type: string;
    trend: string;
    top_misconceptions: Array<{ id: string; count: number; description: string }>;
    recommendations: string[];
  };
  prerequisite_alerts: Array<{
    concept: string; severity: string; fix_order: string[];
  }>;
  cognitive_profile: {
    representation_mode: string;
    abstraction_comfort: number;
    working_memory_est: number;
    narrative: string;
  };
  motivation_trajectory: {
    current_state: string;
    consecutive_failures: number;
    narrative: string;
  };
  strategic_recommendations: string[];
  action_plan: Array<{
    session: number; focus: string; concepts: string[];
    duration_minutes: number; rationale: string;
  }>;
}

const READINESS_CONFIG: Record<string, { label: string; color: string; background: string; border: string }> = {
  'not-ready': { label: 'Foundation Phase', color: 'var(--red)',        background: 'rgba(255,59,48,.06)',   border: '1px solid rgba(255,59,48,.22)' },
  'building':  { label: 'Building',         color: 'var(--orange)',     background: 'rgba(255,159,10,.06)',   border: '1px solid rgba(255,159,10,.22)' },
  'ready':     { label: 'Exam-Ready',       color: 'var(--indigo-ink)', background: 'rgba(88,86,214,.05)',   border: '1px solid rgba(88,86,214,.22)' },
  'confident': { label: 'Peak Form',        color: 'var(--green-ink)',  background: 'rgba(52,199,89,.06)',   border: '1px solid rgba(52,199,89,.22)' },
};

export default function StudentAuditPage() {
  const sessionId = useSession();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('page_view', { page: 'student-audit' });
    apiFetch<{ report: AuditReport }>(`/api/gbrain/audit/${sessionId}`)
      .then(res => setReport(res.report))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleExportMarkdown = async () => {
    const res = await fetch(`/api/gbrain/audit/${sessionId}?format=markdown`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${sessionId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ height: 96, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
        ))}
      </div>
    );
  }

  if (error || !report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <Brain size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>Audit unavailable</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{error || 'Not enough data yet. Practice more problems first.'}</p>
      </motion.div>
    );
  }

  const readiness = READINESS_CONFIG[report.executive_summary.readiness_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Your Audit</h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Generated {new Date(report.generated_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleExportMarkdown}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <BookOpen size={12} /> Export
        </button>
      </div>

      {/* Executive Summary */}
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: readiness.background, border: readiness.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={14} style={{ color: readiness.color }} />
          <span style={{ fontSize: 11, fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em', color: readiness.color }}>
            {readiness.label}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Predicted Score</span>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', color: readiness.color }}>
              {report.executive_summary.predicted_score_range}
            </span>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--text-tertiary)' }}>Biggest Risk</p>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{report.executive_summary.biggest_risk}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--text-tertiary)' }}>Top Strength</p>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{report.executive_summary.top_strength}</p>
          </div>
        </div>
      </div>

      {/* Mastery Heatmap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={13} style={{ color: 'var(--indigo-ink)' }} />
          Mastery Heatmap
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {report.mastery_heatmap.map(h => {
            const pct = Math.round(h.mastery * 100);
            const barColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--red)';

            return (
              <div key={h.topic} style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>{h.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--text-tertiary)' }}>
                    <span>{pct}%</span>
                    <span style={{ color: 'var(--green-ink)' }}>+{h.expected_marks_contribution} marks</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-fill)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 3, background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prerequisite Alerts */}
      {report.prerequisite_alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} style={{ color: 'var(--orange)' }} />
            Foundation Alerts
          </h2>
          {report.prerequisite_alerts.slice(0, 5).map((a, i) => (
            <div key={i} style={{
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              background: a.severity === 'critical' ? 'rgba(255,59,48,.05)' : 'rgba(255,159,10,.05)',
              border: a.severity === 'critical' ? '1px solid rgba(255,59,48,.20)' : '1px solid rgba(255,159,10,.20)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 'var(--weight-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: a.severity === 'critical' ? 'rgba(255,59,48,.15)' : 'rgba(255,159,10,.15)',
                  color: a.severity === 'critical' ? 'var(--red)' : 'var(--orange)',
                }}>
                  {a.severity}
                </span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)' }}>
                  {a.concept.replace(/-/g, ' ')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                Fix order: {a.fix_order.slice(0, 3).map(c => c.replace(/-/g, ' ')).join(' → ')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Cognitive Profile */}
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain size={13} style={{ color: 'var(--indigo-ink)' }} />
          How You Think
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Style', value: report.cognitive_profile.representation_mode },
            { label: 'Abstract', value: `${Math.round(report.cognitive_profile.abstraction_comfort * 100)}%` },
            { label: 'Memory', value: `${report.cognitive_profile.working_memory_est} steps` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)' }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', textTransform: 'capitalize' }}>{value}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.cognitive_profile.narrative}</p>
      </div>

      {/* Motivation */}
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={13} style={{ color: 'var(--orange)' }} />
          Motivation
        </h2>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.motivation_trajectory.narrative}</p>
      </div>

      {/* Strategic Recommendations */}
      {report.strategic_recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={13} style={{ color: 'var(--green-ink)' }} />
            Strategic Recommendations
          </h2>
          {report.strategic_recommendations.map((rec, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.05)', border: '1px solid rgba(52,199,89,.15)' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rec}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={13} style={{ color: 'var(--indigo-ink)' }} />
          Next 3 Sessions
        </h2>
        {report.action_plan.map(s => (
          <div key={s.session} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'var(--weight-bold)', background: 'rgba(88,86,214,.12)', color: 'var(--indigo-ink)' }}>
                  {s.session}
                </span>
                <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{s.focus}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={9} />
                {s.duration_minutes}m
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.rationale}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
