/**
 * GBrainAdminPage — unified admin dashboard for GBrain MOAT operations.
 *
 * Three tabs:
 *   1. Cohort — population insights (misconceptions, bottlenecks, motivation health)
 *   2. Health — system health checks
 *   3. Content — content gap scan + fill controls
 *
 * Auth: requires admin or teacher role. Token passed via Authorization header.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/hooks/useApi';
// v2.5: migrated from @/hooks/useAuth (Supabase) to @/contexts/AuthContext (Vidhya JWT).
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import {
  Users, Activity, Package, RefreshCcw, CheckCircle2, AlertTriangle, XCircle,
  Brain, Target, TrendingUp, Zap, Loader2, Play, Shield,
} from 'lucide-react';

type Tab = 'cohort' | 'health' | 'content';

interface Cohort {
  period_days: number;
  total_students: number;
  top_misconceptions: Array<{ id: string; concept: string; description: string; count: number; impact_score: number }>;
  error_type_distribution: Array<{ type: string; count: number }>;
  bottleneck_concepts: Array<{ concept_id: string; label: string; struggler_count: number }>;
  motivation_health: Record<string, number>;
}

interface HealthReport {
  status: 'healthy' | 'degraded' | 'fail';
  generated_at: string;
  summary: string;
  checks: Array<{ name: string; status: 'ok' | 'warn' | 'fail'; value: any; message: string }>;
}

interface ContentGaps {
  total_gaps: number;
  gaps: Array<{
    concept_id: string; topic: string; difficulty_bucket: string;
    current_count: number; gate_frequency: string; priority: number;
  }>;
}

// v2.5: getToken() is now sync (Vidhya JWT in localStorage). Hook kept
// for callsite compatibility; the Promise wrap is incidental.
function useAuthHeaders() {
  return useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);
}

export default function GBrainAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const getHeaders = useAuthHeaders();
  const [tab, setTab] = useState<Tab>('cohort');
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [gaps, setGaps] = useState<ContentGaps | null>(null);
  const [loading, setLoading] = useState<Record<Tab, boolean>>({ cohort: true, health: true, content: true });
  const [error, setError] = useState<string | null>(null);
  const [fillingTopic, setFillingTopic] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<any>(null);

  useEffect(() => { trackEvent('page_view', { page: 'admin-gbrain' }); }, []);

  const loadCohort = useCallback(async () => {
    setLoading(l => ({ ...l, cohort: true }));
    try {
      const headers = await getHeaders();
      const data = await apiFetch<Cohort>('/api/gbrain/cohort?days=30', { headers });
      setCohort(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(l => ({ ...l, cohort: false }));
    }
  }, [getHeaders]);

  const loadHealth = useCallback(async () => {
    setLoading(l => ({ ...l, health: true }));
    try {
      const headers = await getHeaders();
      const data = await apiFetch<HealthReport>('/api/gbrain/health', { headers });
      setHealth(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(l => ({ ...l, health: false }));
    }
  }, [getHeaders]);

  const loadGaps = useCallback(async () => {
    setLoading(l => ({ ...l, content: true }));
    try {
      const headers = await getHeaders();
      const data = await apiFetch<ContentGaps>('/api/gbrain/content-gap/scan', { headers });
      setGaps(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(l => ({ ...l, content: false }));
    }
  }, [getHeaders]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'admin' && user.role !== 'teacher') return;
    loadCohort();
    loadHealth();
    loadGaps();
  }, [authLoading, user, loadCohort, loadHealth, loadGaps]);

  const handleFillGap = async (topic?: string, budget = 10) => {
    setFillingTopic(topic || 'all');
    setFillResult(null);
    try {
      const headers = await getHeaders();
      const result = await apiFetch<any>('/api/gbrain/content-gap/fill', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic, budget }),
      });
      setFillResult(result);
      loadGaps(); // refresh
    } catch (err) {
      setFillResult({ error: (err as Error).message });
    } finally {
      setFillingTopic(null);
    }
  };

  // Auth gating
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <Shield size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>Sign in required</h2>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>The admin dashboard requires authentication.</p>
        <a
          href="/login"
          className="inline-block mt-2 px-6 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--indigo)', color: 'white' }}
        >
          Sign in
        </a>
      </div>
    );
  }
  if (user.role !== 'admin' && user.role !== 'teacher') {
    return (
      <div className="text-center py-16 space-y-4">
        <Shield size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>Access denied</h2>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>This page is only available to admins and teachers.</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Brain size={20} style={{ color: 'var(--indigo-ink)' }} />
          GBrain Admin
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Cognitive architecture observability + control plane</p>
      </motion.div>

      {/* Tab switcher */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
      >
        {[
          { id: 'cohort' as Tab, label: 'Cohort', icon: Users },
          { id: 'health' as Tab, label: 'Health', icon: Activity },
          { id: 'content' as Tab, label: 'Content', icon: Package },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            style={tab === t.id
              ? { background: 'var(--surface-fill)', color: 'var(--text-primary)' }
              : { color: 'var(--text-tertiary)' }
            }
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }}
        >
          {error}
        </motion.div>
      )}

      {/* === COHORT TAB === */}
      {tab === 'cohort' && (
        <>
          {loading.cohort ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-fill)' }} />
              ))}
            </div>
          ) : cohort ? (
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary stats */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>{cohort.total_students}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>students tracked</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>{cohort.top_misconceptions.length}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>misconceptions ({cohort.period_days}d)</p>
                </div>
              </motion.div>

              {/* Motivation health */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Motivation Health</h3>
                <div className="space-y-2">
                  {Object.entries(cohort.motivation_health).map(([state, count]) => {
                    const pct = cohort.total_students > 0 ? Math.round((count / cohort.total_students) * 100) : 0;
                    const barColor = state === 'driven' || state === 'steady'
                      ? 'rgba(52,199,89,.6)'
                      : state === 'flagging'
                        ? 'rgba(255,149,0,.6)'
                        : 'rgba(255,59,48,.6)';
                    return (
                      <div key={state}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{state}</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-fill)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Top misconceptions */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Top Misconceptions</h3>
                {cohort.top_misconceptions.length === 0 ? (
                  <p
                    className="text-xs p-3 rounded-xl"
                    style={{ color: 'var(--text-tertiary)', background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
                  >
                    No misconceptions logged yet.
                  </p>
                ) : (
                  cohort.top_misconceptions.slice(0, 10).map((m, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono" style={{ color: 'var(--indigo-ink)' }}>{m.id}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: 'var(--text-tertiary)' }}>{m.count}×</span>
                          <span style={{ color: 'var(--green-ink)' }}>impact: {m.impact_score.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.concept} — {m.description}</p>
                    </div>
                  ))
                )}
              </motion.div>

              {/* Error type distribution */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Error Types</h3>
                {cohort.error_type_distribution.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No errors logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {cohort.error_type_distribution.map(e => (
                      <div key={e.type} className="flex items-center justify-between text-xs">
                        <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{e.type.replace(/_/g, ' ')}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{e.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Bottleneck concepts */}
              {cohort.bottleneck_concepts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <AlertTriangle size={13} style={{ color: 'var(--red)' }} />
                    Bottleneck Concepts
                  </h3>
                  {cohort.bottleneck_concepts.slice(0, 10).map(b => (
                    <div
                      key={b.concept_id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,59,48,.05)', border: '1px solid rgba(255,59,48,.15)' }}
                    >
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--red)' }}>{b.struggler_count} strugglers</span>
                    </div>
                  ))}
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={loadCohort}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)', color: 'var(--text-tertiary)' }}
              >
                <RefreshCcw size={13} /> Refresh
              </motion.button>
            </motion.div>
          ) : null}
        </>
      )}

      {/* === HEALTH TAB === */}
      {tab === 'health' && (
        <>
          {loading.health ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface-fill)' }} />
              ))}
            </div>
          ) : health ? (
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* Overall status */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl text-center"
                style={health.status === 'healthy'
                  ? { background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }
                  : health.status === 'degraded'
                    ? { background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' }
                    : { background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)' }
                }
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  {health.status === 'healthy'
                    ? <CheckCircle2 size={18} style={{ color: 'var(--green-ink)' }} />
                    : health.status === 'degraded'
                      ? <AlertTriangle size={18} style={{ color: 'var(--orange)' }} />
                      : <XCircle size={18} style={{ color: 'var(--red)' }} />
                  }
                  <span className="text-lg font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    {health.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{health.summary}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>checked {new Date(health.generated_at).toLocaleTimeString()}</p>
              </motion.div>

              {/* Individual checks */}
              {health.checks.map((c) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl"
                  style={c.status === 'ok'
                    ? { background: 'var(--surface-card)', border: '1px solid var(--separator)' }
                    : c.status === 'warn'
                      ? { background: 'rgba(255,149,0,.05)', border: '1px solid rgba(255,149,0,.20)' }
                      : { background: 'rgba(255,59,48,.05)', border: '1px solid rgba(255,59,48,.20)' }
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    {c.status === 'ok'
                      ? <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--green-ink)' }} />
                      : c.status === 'warn'
                        ? <AlertTriangle size={14} className="shrink-0" style={{ color: 'var(--orange)' }} />
                        : <XCircle size={14} className="shrink-0" style={{ color: 'var(--red)' }} />
                    }
                    <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                  </div>
                  <p className="text-xs ml-6" style={{ color: 'var(--text-tertiary)' }}>{c.message}</p>
                </motion.div>
              ))}

              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={loadHealth}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)', color: 'var(--text-tertiary)' }}
              >
                <RefreshCcw size={13} /> Refresh
              </motion.button>
            </motion.div>
          ) : null}
        </>
      )}

      {/* === CONTENT TAB === */}
      {tab === 'content' && (
        <>
          {loading.content ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface-fill)' }} />
              ))}
            </div>
          ) : gaps ? (
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{gaps.total_gaps}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>content gaps identified</p>
                  </div>
                  <button
                    onClick={() => handleFillGap(undefined, 20)}
                    disabled={fillingTopic !== null}
                    className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    style={{ background: 'var(--green)', color: 'white' }}
                  >
                    {fillingTopic === 'all' ? <Loader2 className="animate-spin" size={13} /> : <Play size={13} />}
                    Fill Top 20
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Auto-generates problems for the highest-priority gaps and verifies them via GBrain's self-check pipeline.
                </p>
              </motion.div>

              {/* Fill result */}
              {fillResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--green-ink)' }}>Generation complete</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {fillResult.error ? `Error: ${fillResult.error}` : (
                      `${fillResult.processed} gap(s) processed. ${(fillResult.results || []).filter((r: any) => r.verified).length} problems verified.`
                    )}
                  </p>
                </motion.div>
              )}

              {/* Top gaps */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Top priority gaps</h3>
                {gaps.gaps.slice(0, 20).map((g) => (
                  <div
                    key={`${g.concept_id}-${g.difficulty_bucket}`}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase"
                          style={g.difficulty_bucket === 'easy'
                            ? { background: 'rgba(52,199,89,.15)', color: 'var(--green-ink)' }
                            : g.difficulty_bucket === 'medium'
                              ? { background: 'rgba(255,149,0,.15)', color: 'var(--orange)' }
                              : { background: 'rgba(255,59,48,.15)', color: 'var(--red)' }
                          }
                        >
                          {g.difficulty_bucket}
                        </span>
                        <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{g.concept_id.replace(/-/g, ' ')}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {g.topic.replace(/-/g, ' ')} · {g.gate_frequency} freq · {g.current_count}/5 problems
                      </p>
                    </div>
                    <div className="text-xs ml-3" style={{ color: 'var(--text-tertiary)' }}>priority: {g.priority}</div>
                  </div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={loadGaps}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--separator)', color: 'var(--text-tertiary)' }}
              >
                <RefreshCcw size={13} /> Refresh
              </motion.button>
            </motion.div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
