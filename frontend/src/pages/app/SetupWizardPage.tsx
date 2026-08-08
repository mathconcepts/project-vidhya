/**
 * SetupWizardPage — admin dashboard at /admin/setup.
 *
 * Mission Control Phase 1, "Setup wizard" panel (SOTA-Facelift-CEO-Review.md
 * §7). Read-only operational readiness view over the same checks
 * `npm run content:setup` (src/jobs/setup-cli.ts) already performs, so an
 * operator can answer "is this deployment ready to generate content?"
 * from the browser instead of SSHing in / reading Render logs.
 *
 * Two tiers of check, matching the backend's own split:
 *   - Status (GET /api/admin/setup/status) loads on mount — cheap, no live
 *     network calls: env var presence (never the key value), DB
 *     reachability, per-syllabus concept-graph resolution counts.
 *   - "Test providers now" is a button, not automatic — it makes a real,
 *     trivially-costed LLM call per configured provider (same
 *     preflightProviders() setup-cli.ts uses), so it only runs when the
 *     operator asks for it.
 *
 * What this page does NOT do, on purpose: no key entry, no secret
 * storage, no syllabus editing. Keys live as env vars on the deploy
 * platform; this is a diagnostic, not a secrets manager. (LLMConfigPage
 * at /llm-config is a different, unrelated per-browser BYOK flow for
 * end-user chat keys — this page is about the SERVER's own env config.)
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wand2, CheckCircle2, XCircle, AlertTriangle, Loader2, Shield, RefreshCw,
  Database, KeyRound, BookOpen, PlayCircle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import { trackEvent } from '@/lib/analytics';
import {
  getSetupStatus, testProviders, SetupApiError,
  type SetupStatus, type ProviderStatus, type ProviderTestResult,
} from '@/api/admin/setup';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

type Tone = 'good' | 'bad' | 'warn' | 'neutral';

/** Pure — merges a provider's static config with its most recent live test
 *  result (if any), so the render logic and the test data stay separate.
 *  Exported for tests. */
export function mergeLiveResult(
  provider: ProviderStatus,
  liveResults: ProviderTestResult[] | null,
): ProviderTestResult | null {
  if (!liveResults) return null;
  return liveResults.find((r) => r.provider === provider.provider) ?? null;
}

/** Pure — tone for one provider row. A live test result (if present)
 *  always wins over the static config-only view, since it's strictly more
 *  informative (a key can be "present" but expired/invalid). Exported for
 *  tests. */
export function providerTone(provider: ProviderStatus, live: ProviderTestResult | null): Tone {
  if (live) return live.ok ? 'good' : 'bad';
  if (!provider.enabled) return 'neutral';
  if (!provider.key_present) return provider.required ? 'bad' : 'warn';
  return 'neutral'; // configured, but not live-tested yet
}

/** Pure — overall banner tone from the status payload. Exported for tests. */
export function overallTone(status: SetupStatus | null): Tone {
  if (!status) return 'neutral';
  return status.hard_requirement_met ? 'good' : 'bad';
}

/** Pure — names of providers currently satisfying readiness (enabled +
 *  key present), for the ready banner's copy. No single provider is
 *  required any more — this just says which one(s) actually are
 *  configured. Exported for tests. */
export function configuredProviderNames(status: SetupStatus | null): string[] {
  if (!status) return [];
  return status.providers.filter((p) => p.enabled && p.key_present).map((p) => p.provider);
}

export const __testing = { mergeLiveResult, providerTone, overallTone, configuredProviderNames };

const TONE_COLOR: Record<Tone, string> = {
  good: 'var(--green-ink)',
  bad: 'var(--red)',
  warn: 'var(--orange-ink)',
  neutral: 'var(--text-tertiary)',
};

export default function SetupWizardPage() {
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [liveResults, setLiveResults] = useState<ProviderTestResult[] | null>(null);
  const [liveTestedAt, setLiveTestedAt] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await getSetupStatus());
      setError(null);
    } catch (e) {
      setError(e instanceof SetupApiError ? e.message : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-setup-wizard' });
    if (authLoading || !user || !isAdminRole(user.role)) return;
    void loadStatus();
  }, [authLoading, user, loadStatus]);

  const handleTestProviders = useCallback(async () => {
    setTesting(true);
    setTestError(null);
    try {
      const { tested_at, results } = await testProviders();
      setLiveResults(results);
      setLiveTestedAt(tested_at);
    } catch (e) {
      setTestError(e instanceof SetupApiError ? e.message : (e as Error).message);
    } finally {
      setTesting(false);
    }
  }, []);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Shield size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>Admin access required</h2>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Setup wizard is gated to admin accounts.</p>
      </div>
    );
  }

  const tone = overallTone(status);
  const configuredProviders = configuredProviderNames(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 768, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <JourneyNudge currentHref="/admin/setup" />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wand2 size={18} style={{ color: 'var(--indigo-ink)' }} />
            Setup wizard
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Same readiness checks as <code>npm run content:setup</code>, from the browser. Read-only — no keys are
            entered or stored here.
          </p>
        </div>
        <button
          onClick={() => void loadStatus()}
          aria-label="Refresh setup status"
          style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {loading && !status && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 className="animate-spin" size={18} style={{ color: 'var(--indigo-ink)' }} />
        </div>
      )}

      {status && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 14,
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${tone === 'good' ? 'rgba(52,199,89,.22)' : 'rgba(255,59,48,.22)'}`,
            background: tone === 'good' ? 'rgba(52,199,89,.06)' : 'rgba(255,59,48,.06)',
          }}>
            {tone === 'good'
              ? <CheckCircle2 size={16} style={{ color: 'var(--green-ink)' }} />
              : <XCircle size={16} style={{ color: 'var(--red)' }} />}
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: tone === 'good' ? 'var(--green-ink)' : 'var(--red)', flex: 1 }}>
              {tone === 'good'
                ? `Ready — ${configuredProviders.join(', ')} configured. Generation can start.`
                : 'Not ready — no LLM provider is configured. Set at least one of GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY.'}
            </span>
            {tone === 'good' && (
              <Link
                to="/admin/journey"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--green)', color: 'var(--text-on-accent)', fontSize: 11, fontWeight: 'var(--weight-medium)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Continue setup <ArrowRight size={11} />
              </Link>
            )}
          </div>

          <Section
            icon={KeyRound}
            title="Providers"
            subtitle="Env-var presence is checked here; press “Test providers now” for a live reachability call."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {status.registry_error && (
                <div style={{ fontSize: 11, color: 'var(--red)' }}>config/providers.yaml: {status.registry_error}</div>
              )}
              {status.providers.map((p) => {
                const live = mergeLiveResult(p, liveResults);
                const t = providerTone(p, live);
                return (
                  <div key={p.provider} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: 'var(--hairline) solid var(--separator)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.provider}
                        {p.required && <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>required</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {p.api_key_env ? `${p.api_key_env} · ` : 'keyless · '}
                        {p.model_count} model{p.model_count === 1 ? '' : 's'} configured
                        {live?.error ? ` · ${live.error}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'var(--weight-medium)', color: TONE_COLOR[t], whiteSpace: 'nowrap' }}>
                      {live ? (live.ok ? 'live ok' : 'live failed') : !p.enabled ? 'disabled' : p.key_present ? 'configured' : 'missing key'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => void handleTestProviders()}
                disabled={testing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', minHeight: 32,
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--indigo-ink)', background: 'var(--surface-card)',
                  color: 'var(--indigo-ink)', fontSize: 12, fontWeight: 'var(--weight-medium)',
                  cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? 0.5 : 1,
                }}
              >
                {testing ? <Loader2 className="animate-spin" size={12} /> : <PlayCircle size={12} />}
                Test providers now
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                Makes one real, minimal-cost live call per configured provider.
              </span>
            </div>
            {liveTestedAt && (
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Last tested {new Date(liveTestedAt).toLocaleString()}
              </div>
            )}
            {testError && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--red)' }}>
                <AlertTriangle size={12} />
                {testError}
              </div>
            )}
          </Section>

          <Section icon={Database} title="Database">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {status.database.configured
                  ? (status.database.reachable ? 'DATABASE_URL is set and reachable.' : `DATABASE_URL is set but unreachable: ${status.database.error}`)
                  : (status.database.note ?? 'DATABASE_URL is not set.')}
              </div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'var(--weight-medium)', color: !status.database.configured ? 'var(--text-tertiary)' : (status.database.reachable ? 'var(--green-ink)' : 'var(--orange-ink)'), whiteSpace: 'nowrap' }}>
                {!status.database.configured ? 'file mode' : (status.database.reachable ? 'reachable' : 'unreachable')}
              </span>
            </div>
          </Section>

          <Section icon={BookOpen} title="Syllabi" subtitle="Concept-graph resolution per registered exam — how much of each exam's declared syllabus has a real concept node to generate against.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {status.syllabi.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: 'var(--hairline) solid var(--separator)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.name}
                      {s.is_default && <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>default</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.id}</div>
                  </div>
                  <div style={{ fontSize: 11, color: s.unresolved_count > 0 ? 'var(--orange-ink)' : 'var(--text-secondary)', textAlign: 'right' }}>
                    {s.concept_count} concept{s.concept_count === 1 ? '' : 's'} resolved
                    {s.unresolved_count > 0 && <div>{s.unresolved_count} unresolved (stub)</div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </motion.div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 4 : 10 }}>
        <Icon size={14} style={{ color: 'var(--indigo-ink)' }} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--text-tertiary)' }}>{subtitle}</p>}
      {children}
    </div>
  );
}
