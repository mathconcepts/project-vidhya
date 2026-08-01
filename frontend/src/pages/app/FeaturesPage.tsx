import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, Loader2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

/**
 * /gate/admin/features — operator-facing feature flag matrix.
 *
 * Renders the state of every module's feature flags so an operator
 * can confirm what a deployment actually has enabled without reading
 * boot logs. Data source: GET /api/orchestrator/features (admin-only).
 *
 * This page is informational. Flipping a flag is intentionally a
 * server-restart operation (env var change) — not an API call —
 * because feature changes are exactly the kind of thing that should
 * have operator oversight, not in-band toggling.
 */

interface ModuleFlag {
  flag:        string;
  enabled:     boolean;
  default:     boolean;
  env_var:     string;
  description: string;
  overridden:  boolean;
}

interface ModuleFeatures {
  module: string;
  flags:  ModuleFlag[];
}

interface FeaturesResponse {
  modules: ModuleFeatures[];
}

export default function FeaturesPage() {
  const { hasRole } = useAuth();
  const [data, setData]       = useState<FeaturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/orchestrator/features');
      if (r.status === 403) {
        setError('Admin role required to view this page.');
        setData(null);
        return;
      }
      if (!r.ok) {
        setError(`Failed to load features: HTTP ${r.status}`);
        setData(null);
        return;
      }
      setData(await r.json());
    } catch (e: unknown) {
      setError(`Network error: ${e instanceof Error ? e.message : 'unknown'}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!hasRole('admin')) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)' }}>
          <AlertCircle style={{ width: 20, height: 20 }} />
          <span>Admin role required to view feature flags.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Settings style={{ width: 24, height: 24, color: 'var(--indigo-ink)' }} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Feature flags</h1>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <RefreshCw style={{ width: 16, height: 16 }} />}
          <span>Refresh</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.22)', display: 'flex', gap: 12 }}
      >
        <Info style={{ width: 20, height: 20, color: 'var(--indigo-ink)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px' }}>
            This page shows feature-flag state for the running deployment. Flags are read from
            environment variables at server boot and cannot be flipped from the UI — change the
            env var on your host (Render, Netlify, etc.) and redeploy.
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ color: 'var(--orange)' }}>Overridden</span> means the value differs from the
            default; <span style={{ color: 'var(--green-ink)' }}>enabled</span> /
            <span style={{ color: 'var(--red)' }}> disabled</span> is the current runtime state.
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24, padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', display: 'flex', alignItems: 'flex-start', gap: 12 }}
        >
          <AlertCircle style={{ width: 20, height: 20, color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ color: 'var(--red)', fontSize: 'var(--text-caption)' }}>{error}</div>
        </motion.div>
      )}

      {loading && !data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}
        >
          <Loader2 style={{ width: 24, height: 24, color: 'var(--text-tertiary)' }} className="animate-spin" />
        </motion.div>
      )}

      {data && data.modules.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}
        >
          No modules with feature flags. Check the auth module is loaded.
        </motion.div>
      )}

      {data && data.modules.map(mod => (
        <motion.div
          key={mod.module}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {mod.module} module
            <span style={{ marginLeft: 8, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>({mod.flags.length} flag{mod.flags.length === 1 ? '' : 's'})</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mod.flags.map(flag => (
              <div
                key={flag.flag}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  background: flag.overridden ? 'rgba(255,149,0,.06)' : 'var(--surface-card)',
                  border: flag.overridden ? '1px solid rgba(255,149,0,.3)' : 'var(--hairline) solid var(--separator)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <code style={{ color: 'var(--indigo-ink)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)' }}>{flag.flag}</code>
                      {flag.overridden && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,149,0,.12)', color: 'var(--orange)', border: '1px solid rgba(255,149,0,.3)' }}>
                          overridden
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{flag.description}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {flag.enabled ? (
                      <ToggleRight style={{ width: 24, height: 24, color: 'var(--green-ink)' }} />
                    ) : (
                      <ToggleLeft style={{ width: 24, height: 24, color: 'var(--red)' }} />
                    )}
                    <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: flag.enabled ? 'var(--green-ink)' : 'var(--red)' }}>
                      {flag.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: 'var(--hairline) solid var(--separator)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span>
                      env: <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{flag.env_var}</code>
                    </span>
                    <span>
                      default: <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{String(flag.default)}</code>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
