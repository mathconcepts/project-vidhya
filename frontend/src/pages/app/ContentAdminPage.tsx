/**
 * ContentAdminPage — observability for the content engine.
 *
 * Shows:
 *   - Lifetime + 14-day tier hit rates (how many served from bundle vs Gemini vs Wolfram)
 *   - Cost trend per day
 *   - Free hit rate percentage (tier-0 + tier-1 as % of total)
 *   - Topic coverage from current bundle
 *   - Generated vs Wolfram-verified counts
 *
 * Auth: admin or teacher role.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import {
  Shield, Loader2, RefreshCcw, Layers, TrendingUp, BookOpen,
} from 'lucide-react';

interface Summary {
  lifetime: {
    total_events: number;
    total_cost_usd: number;
    by_source: Record<string, number>;
    free_hit_rate_pct: number;
    avg_cost_per_event_usd: number;
  };
  last_14_days: Array<{
    day: string;
    total: number;
    cost_usd: number;
    avg_latency_ms: number;
    tier_0: number;
    tier_1: number;
    tier_2: number;
    tier_3: number;
    miss: number;
    free_hit_rate_pct: number;
  }>;
  started_at: string;
}

interface BundleStats {
  version: number;
  total_problems: number;
  total_explainers: number;
  wolfram_verified_count: number;
  by_topic: Record<string, number>;
}

const SOURCE_LABELS: Record<string, { label: string; barColor: string; tier: string }> = {
  'tier-0-bundle-exact':   { label: 'Bundle Exact',    barColor: 'rgba(52,199,89,.6)',   tier: 'Tier 0' },
  'tier-0-explainer':      { label: 'Explainer',       barColor: 'rgba(52,199,89,.5)',   tier: 'Tier 0' },
  'tier-0-client-cache':   { label: 'Client Cache',    barColor: 'rgba(20,184,166,.6)',  tier: 'Tier 0' },
  'tier-1-rag':            { label: 'Bundle RAG',      barColor: 'rgba(88,86,214,.6)',   tier: 'Tier 1' },
  'tier-1-material':       { label: 'Your Notes',      barColor: 'rgba(88,86,214,.5)',   tier: 'Tier 1' },
  'tier-2-generated':      { label: 'Generated (LLM)', barColor: 'rgba(255,149,0,.6)',   tier: 'Tier 2' },
  'tier-3-wolfram-verified': { label: 'Wolfram Verified', barColor: 'rgba(59,130,246,.6)', tier: 'Tier 3' },
  'miss':                  { label: 'Miss',            barColor: 'rgba(255,59,48,.5)',   tier: 'Miss' },
};

export default function ContentAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [stats, setStats] = useState<BundleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const [sum, st] = await Promise.all([
        apiFetch<Summary>('/api/content/telemetry/summary', { headers }),
        apiFetch<BundleStats>('/api/content/stats'),
      ]);
      setSummary(sum);
      setStats(st);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-content' });
    if (authLoading || !user) return;
    if (user.role !== 'admin' && user.role !== 'teacher') return;
    load();
  }, [authLoading, user, load]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Shield size={48} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-secondary)' }}>Admin access required</h2>
        {!user && (
          <a
            href="/login"
            style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--indigo)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', textDecoration: 'none' }}
          >
            Sign in
          </a>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={20} style={{ color: 'var(--indigo-ink)' }} />
            Content Engine
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Tier hit rates, cost trends, bundle inventory</p>
        </div>
        <button
          onClick={load}
          style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
        >
          <RefreshCcw size={13} />
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {loading && !summary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: 80, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} />
          ))}
        </div>
      ) : summary && stats ? (
        <>
          {/* Headline metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(52,199,89,.22)', background: 'rgba(52,199,89,.06)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: 'var(--green-ink)' }}>{summary.lifetime.free_hit_rate_pct}%</p>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--text-secondary)' }}>free tier hit rate</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>target ≥ 85%</p>
            </div>
            <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>
                ${summary.lifetime.avg_cost_per_event_usd.toFixed(5)}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--text-secondary)' }}>avg cost / event</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>lifetime: ${summary.lifetime.total_cost_usd.toFixed(4)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'bundle problems', value: stats.total_problems, color: 'var(--text-primary)' },
              { label: 'explainers', value: stats.total_explainers, color: 'var(--text-primary)' },
              { label: 'Wolfram verified', value: stats.wolfram_verified_count, color: 'var(--green-ink)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 'var(--weight-bold)', color }}>{value}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Lifetime source breakdown */}
          <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={13} style={{ color: 'var(--indigo-ink)' }} />
              Lifetime Source Distribution
            </h3>
            {summary.lifetime.total_events === 0 ? (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No resolve events yet. Use Smart Practice to generate traffic.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(summary.lifetime.by_source)
                  .sort(([, a], [, b]) => b - a)
                  .map(([source, count]) => {
                    const meta = SOURCE_LABELS[source] || { label: source, barColor: 'var(--surface-fill)', tier: '' };
                    const pct = Math.round((count / summary.lifetime.total_events) * 100);
                    return (
                      <div key={source}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{meta.tier}</span>
                            {meta.label}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-fill)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5 }}
                            style={{ height: '100%', borderRadius: 3, background: meta.barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* 14-day trend */}
          <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={13} style={{ color: 'var(--green-ink)' }} />
              Last 14 Days
            </h3>
            {summary.last_14_days.length === 0 ? (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No daily data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {summary.last_14_days.map(d => (
                  <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', width: 40, flexShrink: 0 }}>{d.day.slice(5)}</span>
                    <div style={{ flex: 1, display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden', background: 'var(--surface-fill)' }}>
                      {d.tier_0 > 0 && <div style={{ width: `${(d.tier_0 / d.total) * 100}%`, background: 'rgba(52,199,89,.7)' }} title={`Tier 0: ${d.tier_0}`} />}
                      {d.tier_1 > 0 && <div style={{ width: `${(d.tier_1 / d.total) * 100}%`, background: 'rgba(88,86,214,.7)' }} title={`Tier 1: ${d.tier_1}`} />}
                      {d.tier_2 > 0 && <div style={{ width: `${(d.tier_2 / d.total) * 100}%`, background: 'rgba(255,149,0,.7)' }} title={`Tier 2: ${d.tier_2}`} />}
                      {d.tier_3 > 0 && <div style={{ width: `${(d.tier_3 / d.total) * 100}%`, background: 'rgba(59,130,246,.7)' }} title={`Tier 3: ${d.tier_3}`} />}
                      {d.miss > 0 && <div style={{ width: `${(d.miss / d.total) * 100}%`, background: 'rgba(255,59,48,.6)' }} title={`Miss: ${d.miss}`} />}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', width: 40, textAlign: 'right', flexShrink: 0 }}>{d.total}</span>
                    <span style={{ color: 'var(--green-ink)', fontFamily: 'var(--font-mono)', width: 56, textAlign: 'right', flexShrink: 0 }}>${d.cost_usd.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
              {[
                { label: 'Tier 0 (free)',  bg: 'rgba(52,199,89,.7)' },
                { label: 'Tier 1 (free)',  bg: 'rgba(88,86,214,.7)' },
                { label: 'Tier 2 (LLM)',   bg: 'rgba(255,149,0,.7)' },
                { label: 'Tier 3 (Wolfram)', bg: 'rgba(59,130,246,.7)' },
                { label: 'Miss',           bg: 'rgba(255,59,48,.6)' },
              ].map(({ label, bg }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: bg, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Topic coverage */}
          <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={13} style={{ color: 'var(--indigo-ink)' }} />
              Bundle Topic Coverage
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(stats.by_topic)
                .sort(([, a], [, b]) => b - a)
                .map(([topic, count]) => {
                  const maxCount = Math.max(...Object.values(stats.by_topic));
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={topic}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{topic.replace(/-/g, ' ')}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{count}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-fill)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                          style={{ height: '100%', borderRadius: 2, background: 'rgba(88,86,214,.6)' }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)' }}>
            Tracking since {new Date(summary.started_at).toLocaleDateString()}
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
