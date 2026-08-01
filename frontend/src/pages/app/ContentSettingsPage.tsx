/**
 * ContentSettingsPage — pick which community content bundles to subscribe to,
 * and which source classes to exclude from routing.
 *
 * Route: /gate/content-settings
 *
 * Owning agent: community-content-specialist (under acquisition-manager, CCO).
 *               content-router reads these preferences on every request.
 *
 * Backend endpoints (all shipped):
 *   GET    /api/student/content/bundles           → list available bundles + mode
 *   GET    /api/student/content/subscriptions     → current subscription record
 *   POST   /api/student/content/subscribe         → { bundle_id }
 *   POST   /api/student/content/unsubscribe       → { bundle_id }
 *   POST   /api/student/content/exclude-sources   → { sources: string[] }
 *
 * Design:
 *   - Page is entirely optimistic. User taps a subscribe button → UI
 *     reflects the new state immediately. On network failure we roll back
 *     and show an inline error. Never leaves the user staring at a spinner.
 *   - Source-exclusion toggles exist because a student who opts out of
 *     generated content (LLM) should not have that forced on them by a
 *     per-request allow_generation flag.
 *   - Stub-mode is surfaced honestly: when the content subrepo is in
 *     sha=pending, the page explains why no bundles are available rather
 *     than just showing an empty list.
 *
 * PENDING.md §4.7 — this was the highest-priority frontend gap.
 */

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import {
  BookOpen, Check, CheckCircle2, Loader2, AlertCircle,
  Shield, Sparkles, Wrench, Globe, FileText, Info,
} from 'lucide-react';

// ─── Types (mirror backend) ────────────────────────────────────────────

interface Bundle {
  id: string;
  name: string;
  description: string;
  concept_count: number;
  verified: boolean;
}

interface ContentPin {
  repo: string;
  sha: string;
  pinned_at: string;
  stub: boolean;
}

interface BundlesResponse {
  bundles: Bundle[];
  mode: 'stub' | 'local' | 'live';
  pin: ContentPin;
}

interface Subscription {
  bundles: string[];
  exclude_sources: string[];
  subscribed_at: string;
  updated_at: string;
}

// ─── Known source classes the router supports ──────────────────────────

type ExcludableSource = 'generated' | 'wolfram' | 'uploads' | 'community' | 'cache';

const EXCLUDABLE_SOURCES: Array<{
  id: ExcludableSource;
  label: string;
  icon: typeof Shield;
  description: string;
}> = [
  {
    id: 'generated',
    label: 'LLM-generated content',
    icon: Sparkles,
    description: 'Live-written by an LLM. Fast and broad but unverified. Exclude if you only want human-authored material.',
  },
  {
    id: 'wolfram',
    label: 'Wolfram live queries',
    icon: Wrench,
    description: 'Live numeric answers from Wolfram Alpha. Useful for verify/solve intents; uses a network call.',
  },
  {
    id: 'community',
    label: 'Community contributions',
    icon: Globe,
    description: 'Community-contributed content (non-subscribed bundles). Lower trust than your subscribed bundles.',
  },
  {
    id: 'uploads',
    label: 'My uploaded material',
    icon: FileText,
    description: 'Content from files you upload. Private to your account.',
  },
  {
    id: 'cache',
    label: 'Server cache',
    icon: FileText,
    description: 'Previously fetched or generated content reused across sessions.',
  },
];

// ─── The page ──────────────────────────────────────────────────────────

export default function ContentSettingsPage() {
  const [bundlesData, setBundlesData] = useState<BundlesResponse | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inFlightBundle, setInFlightBundle] = useState<string | null>(null);
  const [bundleError, setBundleError] = useState<Record<string, string>>({});
  const [sourcesInFlight, setSourcesInFlight] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [bundlesResp, subsResp] = await Promise.all([
          authFetch('/api/student/content/bundles'),
          authFetch('/api/student/content/subscriptions'),
        ]);
        if (!bundlesResp.ok) throw new Error(`failed to load bundles (${bundlesResp.status})`);
        if (!subsResp.ok) throw new Error(`failed to load subscriptions (${subsResp.status})`);
        const b: BundlesResponse = await bundlesResp.json();
        const s: Subscription = await subsResp.json();
        if (cancelled) return;
        setBundlesData(b);
        setSubscription(s);
      } catch (e: unknown) {
        if (!cancelled) setError((e instanceof Error ? e.message : null) || 'failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function toggleSubscription(bundleId: string, currentlySubscribed: boolean) {
    if (!subscription) return;
    const previous = subscription.bundles;
    const next = currentlySubscribed
      ? previous.filter(b => b !== bundleId)
      : [...previous, bundleId];
    setSubscription({ ...subscription, bundles: next });
    setInFlightBundle(bundleId);
    setBundleError(prev => { const p = { ...prev }; delete p[bundleId]; return p; });

    try {
      const endpoint = currentlySubscribed
        ? '/api/student/content/unsubscribe'
        : '/api/student/content/subscribe';
      const resp = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundle_id: bundleId }),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        throw new Error(`server returned ${resp.status}${body ? `: ${body.slice(0, 100)}` : ''}`);
      }
      const updated: Subscription = await resp.json();
      setSubscription(updated);
    } catch (e: unknown) {
      setSubscription({ ...subscription, bundles: previous });
      setBundleError(prev => ({ ...prev, [bundleId]: (e instanceof Error ? e.message : null) || 'failed' }));
    } finally {
      setInFlightBundle(null);
    }
  }

  async function toggleExcludedSource(sourceId: ExcludableSource) {
    if (!subscription) return;
    const previous = subscription.exclude_sources;
    const currentlyExcluded = previous.includes(sourceId);
    const next = currentlyExcluded
      ? previous.filter(s => s !== sourceId)
      : [...previous, sourceId];
    setSubscription({ ...subscription, exclude_sources: next });
    setSourcesInFlight(true);
    setSourcesError(null);

    try {
      const resp = await authFetch('/api/student/content/exclude-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: next }),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        throw new Error(`server returned ${resp.status}${body ? `: ${body.slice(0, 100)}` : ''}`);
      }
      const updated: Subscription = await resp.json();
      setSubscription(updated);
    } catch (e: unknown) {
      setSubscription({ ...subscription, exclude_sources: previous });
      setSourcesError((e instanceof Error ? e.message : null) || 'failed');
    } finally {
      setSourcesInFlight(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', padding: '32px 0' }}>
        <Loader2 size={16} className="animate-spin" />
        <span style={{ fontSize: 'var(--text-caption)' }}>Loading your content settings…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', display: 'flex', gap: 12 }}>
        <AlertCircle size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--red)' }}>
            Couldn't load your content settings
          </h2>
          <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 'var(--text-caption)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!bundlesData || !subscription) return null;

  const mode = bundlesData.mode;
  const subscribedIds = new Set(subscription.bundles);
  const excludedSources = new Set(subscription.exclude_sources);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} style={{ color: 'var(--indigo-ink)' }} />
          Content settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Choose which community bundles to prefer, and which source classes to exclude.
          Vidhya's content router respects these settings on every request.
        </p>
      </div>

      {/* Mode banner */}
      <ModeBanner mode={mode} pin={bundlesData.pin} />

      {/* Bundles */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Available bundles</h2>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            Subscribed bundles are checked first. If a bundle contains the concept you're asking about,
            its explainer is served with full source disclosure.
          </p>
        </div>

        {bundlesData.bundles.length === 0 ? (
          <EmptyBundles mode={mode} />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bundlesData.bundles.map(bundle => {
              const isSubscribed = subscribedIds.has(bundle.id);
              const isBusy = inFlightBundle === bundle.id;
              const err = bundleError[bundle.id];
              return (
                <li
                  key={bundle.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: isSubscribed ? '1px solid rgba(88,86,214,.3)' : 'var(--hairline) solid var(--separator)',
                    background: isSubscribed ? 'rgba(88,86,214,.05)' : 'var(--surface-card)',
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{bundle.name}</h3>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{bundle.id}</span>
                        {bundle.verified && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, background: 'rgba(52,199,89,.08)', color: 'var(--green-ink)', padding: '2px 6px', borderRadius: 4 }}>
                            <Shield size={10} /> verified
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{bundle.description}</p>
                      <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {bundle.concept_count} concept{bundle.concept_count === 1 ? '' : 's'}
                      </p>
                      {err && (
                        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={10} /> {err}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleSubscription(bundle.id, isSubscribed)}
                      style={{
                        flexShrink: 0,
                        fontSize: 'var(--text-caption)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: isBusy ? 'wait' : 'pointer',
                        opacity: isBusy ? 0.6 : 1,
                        background: isSubscribed ? 'var(--indigo)' : 'var(--surface-fill)',
                        color: isSubscribed ? '#fff' : 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      aria-label={isSubscribed ? `Unsubscribe from ${bundle.name}` : `Subscribe to ${bundle.name}`}
                    >
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isSubscribed ? (
                        <><Check size={14} /> Subscribed</>
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Source exclusion */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Exclude source classes</h2>
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            Excluded sources are never used, even when a request explicitly allows them.
            Useful if you only want human-authored content or are on a restricted network.
          </p>
        </div>

        {sourcesError && (
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-caption)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>Couldn't save: {sourcesError}</span>
          </div>
        )}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EXCLUDABLE_SOURCES.map(src => {
            const Icon = src.icon;
            const isExcluded = excludedSources.has(src.id);
            return (
              <li
                key={src.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: isExcluded ? '1px solid rgba(255,149,0,.25)' : 'var(--hairline) solid var(--separator)',
                  background: isExcluded ? 'rgba(255,149,0,.05)' : 'var(--surface-card)',
                  padding: 16,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isExcluded}
                    disabled={sourcesInFlight}
                    onChange={() => toggleExcludedSource(src.id)}
                    className="mt-1"
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--orange)' }}
                    aria-describedby={`src-desc-${src.id}`}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                      <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                      {src.label}
                      {isExcluded && (
                        <span style={{ fontSize: 10, background: 'rgba(255,149,0,.1)', color: 'var(--orange)', padding: '2px 6px', borderRadius: 4 }}>
                          excluded
                        </span>
                      )}
                    </div>
                    <p id={`src-desc-${src.id}`} style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                      {src.description}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Footer */}
      <footer style={{ fontSize: 10, color: 'var(--text-tertiary)', paddingTop: 16, borderTop: 'var(--hairline) solid var(--separator)' }}>
        Last updated {new Date(subscription.updated_at).toLocaleString()}
      </footer>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function ModeBanner({ mode, pin }: { mode: 'stub' | 'local' | 'live'; pin: ContentPin }) {
  if (mode === 'live') {
    return (
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', display: 'flex', gap: 12 }}>
        <CheckCircle2 size={16} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 'var(--text-caption)' }}>
          <p style={{ margin: '0 0 2px', color: 'var(--green-ink)', fontWeight: 'var(--weight-semibold)' }}>Community content is live</p>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Pulling from <code style={{ color: 'var(--green-ink)', fontFamily: 'var(--font-mono)' }}>{pin.repo}</code> at commit{' '}
            <code style={{ color: 'var(--green-ink)', fontFamily: 'var(--font-mono)' }}>{pin.sha.slice(0, 8)}</code> (pinned {pin.pinned_at}).
          </p>
        </div>
      </div>
    );
  }
  if (mode === 'local') {
    return (
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.06)', border: '1px solid rgba(88,86,214,.22)', display: 'flex', gap: 12 }}>
        <Info size={16} style={{ color: 'var(--indigo-ink)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 'var(--text-caption)' }}>
          <p style={{ margin: '0 0 2px', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-semibold)' }}>Content served from local subrepo</p>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            This deployment reads community content from <code style={{ color: 'var(--indigo-ink)', fontFamily: 'var(--font-mono)' }}>modules/project-vidhya-content/</code>{' '}
            in the main repo. When the separate content repo goes live, subscriptions here keep working without changes.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)', display: 'flex', gap: 12 }}>
      <AlertCircle size={16} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 'var(--text-caption)' }}>
        <p style={{ margin: '0 0 2px', color: 'var(--orange)', fontWeight: 'var(--weight-semibold)' }}>No community bundles available yet</p>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          The community content subrepo hasn't been pinned on this deployment (<code style={{ fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>sha=pending</code>).
          You'll still receive Vidhya's built-in content; subscriptions unlock when the operator bumps{' '}
          <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>content.pin</code>.
        </p>
      </div>
    </div>
  );
}

function EmptyBundles({ mode }: { mode: 'stub' | 'local' | 'live' }) {
  const reason = mode === 'stub'
    ? 'The content subrepo is in stub mode on this deployment.'
    : 'No bundles have been published yet.';
  return (
    <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) dashed var(--separator)', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{reason}</p>
    </div>
  );
}
