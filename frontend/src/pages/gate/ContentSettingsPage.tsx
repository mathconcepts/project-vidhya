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
// Mirrors the Source type in src/content/router.ts. Omits 'declined' and
// 'subscription' — those aren't user-excludable. 'bundle' (shipped default)
// is technically excludable but excluding it would break most requests,
// so we don't surface it here.

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

  // Per-bundle in-flight + per-bundle inline error states
  const [inFlightBundle, setInFlightBundle] = useState<string | null>(null);
  const [bundleError, setBundleError] = useState<Record<string, string>>({});
  const [sourcesInFlight, setSourcesInFlight] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  // ─── Initial load ────────────────────────────────────────────────────

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
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ─── Subscribe / unsubscribe ─────────────────────────────────────────

  async function toggleSubscription(bundleId: string, currentlySubscribed: boolean) {
    if (!subscription) return;
    // Optimistic update — flip the UI immediately
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
    } catch (e: any) {
      // Roll back optimistic change
      setSubscription({ ...subscription, bundles: previous });
      setBundleError(prev => ({ ...prev, [bundleId]: e?.message || 'failed' }));
    } finally {
      setInFlightBundle(null);
    }
  }

  // ─── Toggle an excluded source ───────────────────────────────────────

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
    } catch (e: any) {
      setSubscription({ ...subscription, exclude_sources: previous });
      setSourcesError(e?.message || 'failed');
    } finally {
      setSourcesInFlight(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading your content settings…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-red-200 font-semibold mb-1">Couldn't load your content settings</h2>
            <p className="text-red-300/80 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-red-200 hover:text-red-100 text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bundlesData || !subscription) return null;

  const mode = bundlesData.mode;
  const subscribedIds = new Set(subscription.bundles);
  const excludedSources = new Set(subscription.exclude_sources);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-400" />
          Content settings
        </h1>
        <p className="text-slate-400 mt-1">
          Choose which community bundles to prefer, and which source classes to exclude.
          Vidhya's content router respects these settings on every request.
        </p>
      </div>

      {/* Mode banner — surfaces the subrepo state honestly */}
      <ModeBanner mode={mode} pin={bundlesData.pin} />

      {/* Bundles */}
      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-white">Available bundles</h2>
          <p className="text-sm text-slate-400">
            Subscribed bundles are checked first. If a bundle contains the concept you're asking about,
            its explainer is served with full source disclosure.
          </p>
        </header>

        {bundlesData.bundles.length === 0 ? (
          <EmptyBundles mode={mode} />
        ) : (
          <ul className="space-y-2">
            {bundlesData.bundles.map(bundle => {
              const isSubscribed = subscribedIds.has(bundle.id);
              const isBusy = inFlightBundle === bundle.id;
              const err = bundleError[bundle.id];
              return (
                <li
                  key={bundle.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isSubscribed
                      ? 'bg-violet-950/30 border-violet-700/60'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-medium">{bundle.name}</h3>
                        <span className="text-xs text-slate-500 font-mono">{bundle.id}</span>
                        {bundle.verified && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-900/40 text-emerald-300 px-1.5 py-0.5 rounded">
                            <Shield className="w-3 h-3" /> verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{bundle.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {bundle.concept_count} concept{bundle.concept_count === 1 ? '' : 's'}
                      </p>
                      {err && (
                        <p className="text-xs text-red-300 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {err}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleSubscription(bundle.id, isSubscribed)}
                      className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-md transition-colors ${
                        isSubscribed
                          ? 'bg-violet-600 hover:bg-violet-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                      } ${isBusy ? 'opacity-60 cursor-wait' : ''}`}
                      aria-label={isSubscribed ? `Unsubscribe from ${bundle.name}` : `Subscribe to ${bundle.name}`}
                    >
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSubscribed ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Subscribed
                        </span>
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
      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-white">Exclude source classes</h2>
          <p className="text-sm text-slate-400">
            Excluded sources are never used, even when a request explicitly allows them.
            Useful if you only want human-authored content or are on a restricted network.
          </p>
        </header>

        {sourcesError && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-md p-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Couldn't save: {sourcesError}</span>
          </div>
        )}

        <ul className="space-y-2">
          {EXCLUDABLE_SOURCES.map(src => {
            const Icon = src.icon;
            const isExcluded = excludedSources.has(src.id);
            return (
              <li
                key={src.id}
                className={`rounded-lg border p-4 transition-colors ${
                  isExcluded
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExcluded}
                    disabled={sourcesInFlight}
                    onChange={() => toggleExcludedSource(src.id)}
                    className="mt-1 w-4 h-4 accent-amber-500 cursor-pointer"
                    aria-describedby={`src-desc-${src.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Icon className="w-4 h-4 text-slate-400" />
                      {src.label}
                      {isExcluded && (
                        <span className="text-xs bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded">
                          excluded
                        </span>
                      )}
                    </div>
                    <p id={`src-desc-${src.id}`} className="text-sm text-slate-400 mt-1">
                      {src.description}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Footer — subscription metadata */}
      <footer className="text-xs text-slate-500 pt-4 border-t border-slate-800">
        Last updated {new Date(subscription.updated_at).toLocaleString()}
      </footer>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function ModeBanner({ mode, pin }: { mode: 'stub' | 'local' | 'live'; pin: ContentPin }) {
  if (mode === 'live') {
    return (
      <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-4 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-emerald-200 font-medium">Community content is live</p>
          <p className="text-emerald-300/80 mt-0.5">
            Pulling from <code className="text-emerald-200">{pin.repo}</code> at commit{' '}
            <code className="text-emerald-200">{pin.sha.slice(0, 8)}</code> (pinned {pin.pinned_at}).
          </p>
        </div>
      </div>
    );
  }
  if (mode === 'local') {
    return (
      <div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-violet-200 font-medium">Content served from local subrepo</p>
          <p className="text-violet-300/80 mt-0.5">
            This deployment reads community content from <code className="text-violet-200">modules/project-vidhya-content/</code>{' '}
            in the main repo. When the separate content repo goes live, subscriptions here keep working without changes.
          </p>
        </div>
      </div>
    );
  }
  // stub
  return (
    <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 flex gap-3">
      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="text-amber-200 font-medium">No community bundles available yet</p>
        <p className="text-amber-300/80 mt-0.5">
          The community content subrepo hasn't been pinned on this deployment (<code className="text-amber-200">sha=pending</code>).
          You'll still receive Vidhya's built-in content; subscriptions unlock when the operator bumps{' '}
          <code className="text-amber-200">content.pin</code>.
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
    <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-lg p-6 text-center">
      <p className="text-slate-400 text-sm">{reason}</p>
    </div>
  );
}
