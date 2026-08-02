/**
 * PlatformHealthPage — admin dashboard at /admin/platform-health.
 *
 * Mission Control Phase 1, "Health & costs" panel — first slice
 * (SOTA-Facelift-CEO-Review.md §7.5, §14). Read-only view over
 * GET /api/admin/platform-health: DB connectivity, job status, quota
 * ledger call volume (last 24h), content bundle stats, explainer
 * placeholder count, the pg-import allowlist ratchet, and provider price
 * staleness.
 *
 * Honesty note: this panel does NOT show a rupee cost figure. The quota
 * ledger records call counts and success/failure, not token cost — see
 * the backend route's docblock. Showing a fabricated ₹ number would
 * violate this project's own "labels never lie" law, so the panel says
 * so plainly instead.
 *
 * Auth: admin role only. Falls back to a friendly gate for non-admins.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Loader2, Shield, RefreshCw, Database, AlertTriangle, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { getPlatformHealth, type PlatformHealth } from '@/api/admin/platform-health';

export default function PlatformHealthPage() {
  const { user, loading: authLoading } = useAuth();

  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await getPlatformHealth());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-platform-health' });
    if (authLoading || !user) return;
    if (user.role !== 'admin') return;
    void load();
  }, [authLoading, user, load]);

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
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Platform Health is gated to admin accounts.</p>
      </div>
    );
  }

  const placeholderPct =
    health?.explainer_placeholders && health.explainer_placeholders.total > 0
      ? (health.explainer_placeholders.placeholder / health.explainer_placeholders.total) * 100
      : null;

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
            <Activity size={18} style={{ color: 'var(--indigo-ink)' }} />
            Platform health
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Every number below is a real query over ledgers that already exist — no new dashboard framework.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh platform health"
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

      {health && (
        <>
          {health.kill_switch_engaged && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)' }}>
              <Ban size={14} style={{ color: 'var(--red)' }} />
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--red)', fontWeight: 'var(--weight-medium)' }}>
                Global kill switch engaged (CONTENT_JOBS_DISABLED=true) — no content job can start.
              </span>
            </div>
          )}

          {/* Headline KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <KpiCard
              icon={Database}
              label="Database"
              value={health.db.ok ? 'Connected' : 'Unreachable'}
              tone={health.db.ok ? 'good' : 'bad'}
              sub={health.db.error ?? (health.db.ok ? 'DATABASE_URL reachable' : undefined)}
            />
            <KpiCard
              icon={Activity}
              label="Provider calls (24h)"
              value={health.quota_calls_24h.total_calls.toString()}
              sub={health.quota_calls_24h.by_provider.map((p) => `${p.provider}:${p.calls}`).join(', ') || 'no calls yet'}
            />
            <KpiCard
              icon={AlertTriangle}
              label="pg-allowlist"
              value={health.pg_allowlist_remaining != null ? health.pg_allowlist_remaining.toString() : '—'}
              sub="files outside src/storage/ still importing pg directly"
            />
          </div>

          {/* Cost tracking — honest gap, not a fabricated number */}
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            ₹-per-concept cost is not tracked yet — the quota ledger records call counts and success/failure per
            provider, not token cost. Showing a rupee figure here without real cost data would be a fabricated
            number, so this panel doesn't show one.
          </div>

          {/* Jobs */}
          <Section title="Background jobs">
            <Table
              headers={['Job', 'State', 'Progress', 'Last update']}
              rows={health.jobs.map((j) => [
                j.name,
                j.status?.state ?? 'idle',
                j.status ? `${j.status.progress.done}/${j.status.progress.total} (${j.status.progress.failed} failed, ${j.status.progress.skipped} skipped)` : '—',
                j.status?.last_update ? new Date(j.status.last_update).toLocaleString() : '—',
              ])}
            />
          </Section>

          {/* Content bundle */}
          {health.content_bundle && (
            <Section title="Content bundle">
              <Table
                headers={['Problems', 'Wolfram-verified', 'Explainers', 'Built']}
                rows={[[
                  health.content_bundle.total_problems.toString(),
                  health.content_bundle.wolfram_verified.toString(),
                  health.content_bundle.total_explainers.toString(),
                  health.content_bundle.generated_at ? new Date(health.content_bundle.generated_at).toLocaleString() : '—',
                ]]}
              />
            </Section>
          )}

          {/* Explainer placeholders */}
          {health.explainer_placeholders && (
            <Section title="Explainer placeholder ratchet">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-mono)', color: placeholderPct === 100 ? 'var(--red)' : placeholderPct && placeholderPct > 0 ? 'var(--text-secondary)' : 'var(--green-ink)' }}>
                  {health.explainer_placeholders.placeholder}/{health.explainer_placeholders.total}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  still on model:"placeholder" — run <code style={{ fontFamily: 'var(--font-mono)' }}>npm run content:explainers</code> with a real key to replace them.
                </span>
              </div>
            </Section>
          )}

          {/* Provider price staleness */}
          {health.provider_price_staleness.length > 0 && (
            <Section title="Provider price staleness">
              <Table
                headers={['Provider', 'Priced at', 'Age (days)', 'Status']}
                rows={health.provider_price_staleness.map((p) => [
                  p.provider,
                  p.pricedAt ?? 'never',
                  p.ageDays != null ? p.ageDays.toString() : '—',
                  p.stale ? 'stale — re-verify' : 'fresh',
                ])}
                toneForRow={(row) => (row[3].startsWith('stale') ? 'bad' : 'neutral')}
              />
            </Section>
          )}

          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>
            Nightly cron: {health.nightly_cron_enabled ? 'enabled' : 'disabled (default)'} · Generated {new Date(health.generated_at).toLocaleString()}
          </p>
        </>
      )}
    </motion.div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const color = tone === 'good' ? 'var(--green-ink)' : tone === 'bad' ? 'var(--red)' : 'var(--text-primary)';
  return (
    <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 'var(--weight-medium)' }}>
        <Icon size={11} style={{ color: 'var(--indigo-ink)' }} />
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 'var(--weight-bold)', color, fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{title}</h2>
      {children}
    </section>
  );
}

function Table({
  headers,
  rows,
  toneForRow,
}: {
  headers: string[];
  rows: string[][];
  toneForRow?: (row: string[]) => 'good' | 'bad' | 'neutral';
}) {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--surface-fill)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
            <tr>
              {headers.map((h, idx) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: idx === 0 ? 'left' : 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: 12, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No data yet.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const tone = toneForRow?.(row) ?? 'neutral';
                const color = tone === 'bad' ? 'var(--red)' : tone === 'good' ? 'var(--green-ink)' : 'var(--text-secondary)';
                return (
                  <tr key={i} style={{ borderBottom: i < rows.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '8px 12px', color: j === 0 ? 'var(--text-primary)' : color, fontFamily: j === 0 ? undefined : 'var(--font-mono)' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
