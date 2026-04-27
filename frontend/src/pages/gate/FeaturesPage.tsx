import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToggleLeft, ToggleRight, Loader2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

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
    } catch (e: any) {
      setError(`Network error: ${e?.message ?? 'unknown'}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Admin-only access (matches UserAdminPage pattern)
  if (!hasRole('admin')) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="w-5 h-5" />
          <span>Admin role required to view feature flags.</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-sky-400" />
          <h1 className="text-2xl font-semibold text-surface-50">Feature flags</h1>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Refresh</span>
        </button>
      </motion.div>

      <motion.div variants={fadeInUp} className="mb-6 p-4 rounded-lg bg-surface-900 border border-surface-700 flex gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm text-surface-300 leading-relaxed">
          <p className="mb-2">
            This page shows feature-flag state for the running deployment. Flags are read from
            environment variables at server boot and cannot be flipped from the UI — change the
            env var on your host (Render, Netlify, etc.) and redeploy.
          </p>
          <p>
            <span className="text-amber-400">Overridden</span> means the value differs from the
            default; <span className="text-emerald-400">enabled</span> /
            <span className="text-rose-400"> disabled</span> is the current runtime state.
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="mb-6 p-4 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-rose-300 text-sm">{error}</div>
        </motion.div>
      )}

      {loading && !data && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-surface-500" />
        </motion.div>
      )}

      {data && data.modules.length === 0 && (
        <motion.div variants={fadeInUp} className="text-center py-12 text-surface-500">
          No modules with feature flags. Check the auth module is loaded.
        </motion.div>
      )}

      {data && data.modules.map(mod => (
        <motion.div key={mod.module} variants={fadeInUp} className="mb-8">
          <h2 className="text-lg font-medium text-surface-100 mb-3 capitalize">
            {mod.module} module
            <span className="ml-2 text-sm text-surface-500">({mod.flags.length} flag{mod.flags.length === 1 ? '' : 's'})</span>
          </h2>

          <div className="space-y-3">
            {mod.flags.map(flag => (
              <div
                key={flag.flag}
                className={clsx(
                  'p-4 rounded-lg border',
                  flag.overridden
                    ? 'bg-amber-950/20 border-amber-800/50'
                    : 'bg-surface-900 border-surface-700',
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sky-300 font-mono text-sm">{flag.flag}</code>
                      {flag.overridden && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50">
                          overridden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-300 leading-relaxed">{flag.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {flag.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-rose-400" />
                    )}
                    <span className={clsx(
                      'text-sm font-medium',
                      flag.enabled ? 'text-emerald-400' : 'text-rose-400',
                    )}>
                      {flag.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-700/50 flex items-center justify-between gap-4 text-xs text-surface-400">
                  <div className="flex items-center gap-4">
                    <span>
                      env: <code className="text-surface-300 font-mono">{flag.env_var}</code>
                    </span>
                    <span>
                      default: <code className="text-surface-300 font-mono">{String(flag.default)}</code>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
