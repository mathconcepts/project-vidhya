/**
 * ErrorPatternsPage — GBrain error pattern report.
 * Shows error type breakdown, trends, top misconceptions, and actionable recommendations.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { trackEvent } from '@/lib/analytics';
import { CountUp } from '@/components/app/CountUp';
import {
  Brain, TrendingDown, TrendingUp, Minus, AlertTriangle, Lightbulb,
  Target, GitBranch, Calculator, Clock, Eye, SkipForward,
} from 'lucide-react';

interface ErrorReport {
  session_id: string;
  total_errors: number;
  by_type: Record<string, number>;
  by_concept: Record<string, number>;
  top_misconceptions: Array<{ id: string; count: number; description: string }>;
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

const ERROR_ICONS: Record<string, typeof Brain> = {
  conceptual: Brain,
  procedural: GitBranch,
  notation: Eye,
  misread: AlertTriangle,
  time_pressure: Clock,
  arithmetic: Calculator,
  overconfidence_skip: SkipForward,
};

const ERROR_BAR_COLORS: Record<string, string> = {
  conceptual: 'var(--red)',
  procedural: 'var(--orange)',
  notation: 'var(--indigo)',
  misread: 'var(--indigo)',
  time_pressure: 'var(--orange)',
  arithmetic: 'var(--green)',
  overconfidence_skip: 'var(--orange)',
};

const ERROR_LABELS: Record<string, string> = {
  conceptual: 'Conceptual',
  procedural: 'Procedural',
  notation: 'Notation',
  misread: 'Misread',
  time_pressure: 'Time Pressure',
  arithmetic: 'Arithmetic',
  overconfidence_skip: 'Skipped Steps',
};

export default function ErrorPatternsPage() {
  const sessionId = useSession();
  const [report, setReport] = useState<ErrorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    trackEvent('page_view', { page: 'error-patterns' });
  }, []);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ report: ErrorReport }>(`/api/gbrain/errors/${sessionId}?days=${days}`)
      .then(res => setReport(res.report))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId, days]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 80, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />
        ))}
      </div>
    );
  }

  if (!report || report.total_errors === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <Brain size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>No errors to analyze</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Practice more problems to see your error patterns here.</p>
      </motion.div>
    );
  }

  const TrendIcon = report.trend === 'improving' ? TrendingDown : report.trend === 'declining' ? TrendingUp : Minus;
  const trendColor = report.trend === 'improving' ? 'var(--green-ink)' : report.trend === 'declining' ? 'var(--red)' : 'var(--text-tertiary)';
  const trendLabel = report.trend === 'improving' ? 'Fewer errors than last week' : report.trend === 'declining' ? 'More errors than last week' : 'Similar to last week';

  const typeEntries = Object.entries(report.by_type).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Error Patterns</h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>Understand your mistakes to eliminate them</p>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
        {[
          { d: 7, label: '7 days' },
          { d: 14, label: '14 days' },
          { d: 30, label: '30 days' },
        ].map(opt => (
          <button
            key={opt.d}
            onClick={() => setDays(opt.d)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 'var(--weight-semibold)', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: days === opt.d ? 'var(--surface-card)' : 'transparent',
              color: days === opt.d ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <CountUp target={report.total_errors} style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }} />
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>total errors</p>
        </div>
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <TrendIcon size={16} style={{ color: trendColor }} />
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', color: trendColor }}>
              {report.trend.charAt(0).toUpperCase() + report.trend.slice(1)}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>{trendLabel}</p>
        </div>
      </div>

      {/* Error Type Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Error Type Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {typeEntries.map(([type, count]) => {
            const pct = Math.round((count / report.total_errors) * 100);
            const Icon = ERROR_ICONS[type] || Brain;
            return (
              <div key={type} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{ERROR_LABELS[type] || type}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-fill)', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 999, background: ERROR_BAR_COLORS[type] || 'var(--text-tertiary)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Misconceptions */}
      {report.top_misconceptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={13} style={{ color: 'var(--red)' }} />
            Top Misconceptions
          </h2>
          {report.top_misconceptions.map((m, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--indigo-ink)' }}>{m.id.replace(/-/g, ' ')}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.count}×</span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{m.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={13} style={{ color: 'var(--green-ink)' }} />
            Recommendations
          </h2>
          {report.recommendations.map((rec, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{rec}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
