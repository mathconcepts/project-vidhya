import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, RefreshCw, AlertCircle, AlertTriangle,
  Users, DollarSign, Activity, Coins, Server, FileText,
  UserPlus, Target, Plus, Trash2, CheckCircle2, Circle,
  Clock, Calendar, XCircle, Wrench, HelpCircle, Link2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { AdminQuickLinks } from '@/components/admin/AdminQuickLinks';

/**
 * /admin/founder — the founder page. A strict superset of /admin:
 * everything an admin can reach (via the shared AdminQuickLinks grid
 * at the bottom), plus founder-only "master rights" material —
 * business metrics from /api/operator/dashboard, and "Complete AND
 * Paid," the 90-day operating system for a time-starved founder
 * (/api/operator/founder-os).
 *
 * Owner-role gated (not admin) — see requireOwner() in
 * src/api/operator-routes.ts. An admin who is not the owner does not
 * see this page at all; that asymmetry is the "master rights" part.
 *
 * Closes the loop on the operator module shipped in ec74122 — the
 * API exposed the data; this page surfaces it.
 *
 * Design decisions:
 *
 *   - Card-based layout, no charts. Charts would need a library
 *     (recharts ~150kb gzipped); the data here is small enough
 *     that bare numbers + sparklines-as-text suffice.
 *   - Caveats from the API response are surfaced prominently —
 *     the operator should see what's NOT in the view, not just
 *     what is.
 *   - Refresh button for explicit re-fetch (no polling — this is
 *     a periodic-glance dashboard, not a real-time feed).
 *   - All-or-nothing render — if the API returns 200 the page
 *     shows everything; on error it shows just the error.
 */

interface FounderDashboard {
  generated_at: string;
  users: {
    total:     number;
    active_7d: number;
    new_30d:   number;
    by_role:   Record<string, number>;
  };
  revenue?: {
    total_30d:      Record<string, number>;
    paid_users_30d: number;
    arpu_30d:       Record<string, number>;
  };
  activity: {
    chat_sent_7d:     number;
    plans_run_7d:     number;
    library_views_7d: number;
    studio_drafts_7d: number;
  };
  lifecycle: {
    signups_30d:         number;
    channels_linked_30d: number;
    role_changes_30d:    number;
  };
  cost: {
    llm_tokens_7d:        number;
    llm_estimated_usd_7d: number | null;
    budget_used_today:    number;
  };
  health: {
    modules: Array<{ name: string; status: string; detail: string }>;
    tests_status: string;
  };
  caveats: string[];
}

interface FounderOsMilestone {
  id:            string;
  title:         string;
  description?:  string;
  category?:     string;
  target_date?:  string;
  status:        'not_started' | 'in_progress' | 'done';
  completed_at?: string;
}

interface FounderOsView {
  plan_id: string;
  window: {
    start: string; end: string; days_total: number;
    days_elapsed: number; days_remaining: number; pct_elapsed: number;
  };
  complete: {
    milestones: FounderOsMilestone[];
    total: number; done: number; pct_complete: number;
    pace_note: string | null;
  };
  paid: {
    collected_minor: number; currency: string;
    target_minor: number | null; pct_of_target: number | null;
  };
  time_budget: { weekly_hours: number | null };
  settings: {
    revenue_target_minor: number | null;
    revenue_target_currency: string;
    weekly_hours_budget: number | null;
  };
}

interface MappingCoverageView {
  total_atomic_ids: number;
  mapped: number;
  unmapped: number;
  unmapped_reasons: Record<string, string>;
  concepts_with_multiple_atomic_ids: Record<string, string[]>;
  concepts_without_atomic_id: string[];
}

interface VerificationReportView {
  practice_bank: {
    total_items: number;
    with_verification_method: number;
    hand_checkable_count: number;
  };
  content_bundle: {
    total_problems: number;
    wolfram_verified: number;
    never_yet_swept: number;
  };
  headline: {
    hand_verified_coverage_pct: number;
    automated_sweep_coverage_pct: number;
  };
  caveats: string[];
}

export default function FounderDashboardPage() {
  const { hasRole } = useAuth();
  const [data, setData]       = useState<FounderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [os, setOs]               = useState<FounderOsView | null>(null);
  const [osLoading, setOsLoading] = useState(true);
  const [osError, setOsError]     = useState<string | null>(null);

  const [verifyReport, setVerifyReport]   = useState<VerificationReportView | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(true);

  const [mapping, setMapping]           = useState<MappingCoverageView | null>(null);
  const [mappingLoading, setMappingLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/operator/dashboard');
      if (r.status === 403) {
        setError('Admin role required to view this page.');
        setData(null);
        return;
      }
      if (!r.ok) {
        setError(`Failed to load dashboard: HTTP ${r.status}`);
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

  const refreshOs = useCallback(async () => {
    setOsLoading(true);
    setOsError(null);
    try {
      const r = await authFetch('/api/operator/founder-os');
      if (r.status === 403) {
        setOsError('Owner role required.');
        setOs(null);
        return;
      }
      if (!r.ok) {
        setOsError(`Failed to load the 90-day OS: HTTP ${r.status}`);
        setOs(null);
        return;
      }
      setOs(await r.json());
    } catch (e: any) {
      setOsError(`Network error: ${e?.message ?? 'unknown'}`);
      setOs(null);
    } finally {
      setOsLoading(false);
    }
  }, []);

  const refreshVerifyReport = useCallback(async () => {
    setVerifyLoading(true);
    try {
      const r = await authFetch('/api/operator/verification-report');
      if (r.ok) setVerifyReport(await r.json());
      else setVerifyReport(null);
    } catch {
      setVerifyReport(null);
    } finally {
      setVerifyLoading(false);
    }
  }, []);

  const refreshMapping = useCallback(async () => {
    setMappingLoading(true);
    try {
      const r = await authFetch('/api/admin/content-spec/mapping');
      if (r.ok) setMapping(await r.json());
      else setMapping(null);
    } catch {
      setMapping(null);
    } finally {
      setMappingLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); refreshOs(); refreshVerifyReport(); refreshMapping(); }, [refresh, refreshOs, refreshVerifyReport, refreshMapping]);

  if (!hasRole('owner')) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2" style={{ color: 'var(--red)' }}>
          <AlertCircle className="w-5 h-5" />
          <span>Owner (Founder) role required to view this page.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Server className="w-6 h-6" />
            Founder dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Complete AND Paid — the 90-day operating system — plus users, revenue,
            activity, cost, and module health. A superset of the admin dashboard.
          </p>
        </div>
        <button
          onClick={() => { refresh(); refreshOs(); refreshVerifyReport(); refreshMapping(); }}
          disabled={loading || osLoading || verifyLoading || mappingLoading}
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: (loading || osLoading || verifyLoading || mappingLoading) ? 'not-allowed' : 'pointer', opacity: (loading || osLoading || verifyLoading || mappingLoading) ? 0.5 : 1 }}
          aria-label="refresh"
        >
          {(loading || osLoading || verifyLoading || mappingLoading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </header>

      {loading && !data && (
        <div className="flex items-center gap-2 py-12 justify-center" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 className="w-5 h-5 animate-spin" /> loading dashboard…
        </div>
      )}

      {error && (
        <div className="rounded p-4 flex items-start gap-2" style={{ background: 'rgba(255,59,48,.1)', border: 'var(--hairline) solid rgba(255,59,48,.3)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
          <div>
            <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
            <button
              onClick={refresh}
              className="text-xs underline mt-1"
              style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              try again
            </button>
          </div>
        </div>
      )}

      {/* "Complete AND Paid" — the 90-day operating system. Rendered ahead
          of the business-metrics grid below: for a time-starved founder
          this is the one thing the page exists to answer today. */}
      <CompleteAndPaidSection
        os={os}
        loading={osLoading}
        error={osError}
        onRefresh={refreshOs}
      />

      {/* ELI5 product-readiness explainer — what works, what's still needed,
          what will mislead if demoed wrong, and what it takes to fix it.
          The two headline numbers are live; the four lists are editorial
          judgment calls, kept in sync by hand as the product changes. */}
      <ProductReadinessSection report={verifyReport} loading={verifyLoading} />

      {/* The atomic_id <-> concept_id crosswalk (docs/content-spec/, per
          "atomic id and concept id are same — ensure the mapping" and
          "this mapping info should also be available in owner page").
          Honest about where the two id spaces diverge, not just a count. */}
      <ContentSpecMappingSection mapping={mapping} loading={mappingLoading} />

      {data && (
        <div className="space-y-6">
          {/* Caveats banner — show first if any */}
          {data.caveats.length > 0 && (
            <CaveatsBanner caveats={data.caveats} />
          )}

          {/* Top row — primary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <UsersCard users={data.users} />
            <RevenueCard revenue={data.revenue} />
            <ActivityCard activity={data.activity} />
            <CostCard cost={data.cost} />
          </div>

          {/* Lifecycle events — full width with 3 inline metrics */}
          <LifecycleCard lifecycle={data.lifecycle} />

          {/* Module health table */}
          <HealthTable
            modules={data.health.modules}
            tests_status={data.health.tests_status}
          />

          {/* Footer with generated_at */}
          <p className="text-xs text-right" style={{ color: 'var(--text-tertiary)' }}>
            Generated at {new Date(data.generated_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Every admin page, reachable from here — makes this page a literal
          navigation superset of /admin, not just a metrics add-on. Always
          true here: reaching this render means hasRole('owner') passed
          above, which implies admin too. */}
      <div className="mt-6">
        <AdminQuickLinks isOwner={true} />
      </div>
    </div>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────

function Card({
  icon: Icon, title, children, footer,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded p-4 flex flex-col" style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', border: 'var(--hairline) solid var(--separator)' }}>
      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        <Icon className="w-4 h-4" />
        <span className="font-medium uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex-1">
        {children}
      </div>
      {footer && (
        <div className="text-xs mt-3 pt-2" style={{ color: 'var(--text-tertiary)', borderTop: 'var(--hairline) solid var(--separator)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

function UsersCard({ users }: { users: FounderDashboard['users'] }) {
  const roles = Object.entries(users.by_role).filter(([_, n]) => n > 0);
  return (
    <Card icon={Users} title="Users">
      <div className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{users.total}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
        {users.active_7d} active in last 7 days
      </div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {users.new_30d} new in last 30 days
      </div>
      {roles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {roles.map(([role, n]) => (
            <span
              key={role}
              className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: 'var(--surface-fill)', color: 'var(--text-secondary)' }}
            >
              {role}:{n}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function RevenueCard({ revenue }: { revenue?: FounderDashboard['revenue'] }) {
  if (!revenue || Object.keys(revenue.total_30d).length === 0) {
    return (
      <Card icon={DollarSign} title="Revenue (30d)">
        <div className="text-2xl font-semibold" style={{ color: 'var(--text-tertiary)' }}>—</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          No payments recorded yet.
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Configure Stripe webhook or POST manual payments to start tracking.
        </div>
      </Card>
    );
  }
  const currencies = Object.entries(revenue.total_30d);
  return (
    <Card icon={DollarSign} title="Revenue (30d)">
      {currencies.map(([currency, minor]) => (
        <div key={currency} className="flex items-baseline justify-between">
          <span className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatMoney(minor, currency)}
          </span>
          <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>{currency}</span>
        </div>
      ))}
      <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
        {revenue.paid_users_30d} paid {revenue.paid_users_30d === 1 ? 'user' : 'users'}
      </div>
      {revenue.paid_users_30d > 0 && Object.entries(revenue.arpu_30d).map(([currency, minor]) => (
        <div key={currency} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          ARPU {formatMoney(minor, currency)} {currency}
        </div>
      ))}
    </Card>
  );
}

function ActivityCard({ activity }: { activity: FounderDashboard['activity'] }) {
  return (
    <Card icon={Activity} title="Activity (7d)">
      <div className="space-y-1.5">
        <ActivityRow label="Chat sent" value={activity.chat_sent_7d} />
        <ActivityRow label="Plans run" value={activity.plans_run_7d} />
        <ActivityRow label="Library views" value={activity.library_views_7d} />
        <ActivityRow label="Studio drafts" value={activity.studio_drafts_7d} />
      </div>
    </Card>
  );
}

function ActivityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{value.toLocaleString()}</span>
    </div>
  );
}

function CostCard({ cost }: { cost: FounderDashboard['cost'] }) {
  return (
    <Card icon={Coins} title="LLM Cost (7d)">
      <div className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        {(cost.llm_tokens_7d / 1000).toFixed(1)}k
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>tokens estimated</div>
      <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {cost.llm_estimated_usd_7d !== null
          ? `~$${cost.llm_estimated_usd_7d.toFixed(2)} USD`
          : 'No pricing model configured'}
      </div>
      {cost.budget_used_today > 0 && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {cost.budget_used_today.toLocaleString()} tokens used today
        </div>
      )}
    </Card>
  );
}

// ─── Lifecycle card — full-width, 3 inline metrics ───────────────────
//
// Surfaces signup / channel-link / role-change events from the operator
// analytics adapter. Different visual treatment from the 4-col primary
// cards because the data is sparser (most deployments will see a few
// signups per week, not per minute) — a full-width strip with three
// inline metrics fits better than a tall card with a single big number.

function LifecycleCard({ lifecycle }: { lifecycle: FounderDashboard['lifecycle'] }) {
  const total = lifecycle.signups_30d + lifecycle.channels_linked_30d + lifecycle.role_changes_30d;
  return (
    <div className="rounded p-4" style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', border: 'var(--hairline) solid var(--separator)' }}>
      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        <UserPlus className="w-4 h-4" />
        <span className="font-medium uppercase tracking-wider">
          Lifecycle events (30d)
        </span>
      </div>
      {total === 0 ? (
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          No lifecycle events recorded in the last 30 days.{' '}
          <span style={{ color: 'var(--text-tertiary)' }}>
            Events fire on signup, channel-link, and role-change. New activity will populate this section over time.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LifecycleStat
            label="Signups"
            value={lifecycle.signups_30d}
            hint="new users registered"
          />
          <LifecycleStat
            label="Channels linked"
            value={lifecycle.channels_linked_30d}
            hint="Telegram / WhatsApp connections"
          />
          <LifecycleStat
            label="Role changes"
            value={lifecycle.role_changes_30d}
            hint="admin promoted / demoted users"
          />
        </div>
      )}
    </div>
  );
}

function LifecycleStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value.toLocaleString()}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{hint}</div>
    </div>
  );
}

// ─── Module health table ───────────────────────────────────────────

function HealthTable({
  modules, tests_status,
}: {
  modules: FounderDashboard['health']['modules'];
  tests_status: string;
}) {
  return (
    <div className="rounded" style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', border: 'var(--hairline) solid var(--separator)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: 'var(--hairline) solid var(--separator)' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Server className="w-4 h-4" />
          <span className="font-medium uppercase tracking-wider">
            Module health ({modules.length})
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
          tests: {tests_status}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {modules.map(m => (
            <tr key={m.name} style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
              <td className="px-4 py-2 font-mono text-xs w-40" style={{ color: 'var(--text-secondary)' }}>
                {m.name}
              </td>
              <td className="px-2 py-2 w-24">
                <HealthBadge status={m.status} />
              </td>
              <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {m.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HealthBadge({ status }: { status: string }) {
  const style: React.CSSProperties = status === 'healthy'
    ? { background: 'rgba(52,199,89,.1)', color: 'var(--green-ink)', border: '1px solid rgba(52,199,89,.3)' }
    : status === 'degraded'
    ? { background: 'rgba(255,159,10,.1)', color: 'var(--orange)', border: '1px solid rgba(255,159,10,.3)' }
    : status === 'unavailable'
    ? { background: 'rgba(255,59,48,.1)', color: 'var(--red)', border: '1px solid rgba(255,59,48,.3)' }
    : { background: 'var(--surface-fill)', color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)' };
  return (
    <span className="text-xs px-2 py-0.5 rounded" style={style}>
      {status}
    </span>
  );
}

// ─── Caveats banner ─────────────────────────────────────────────────

function CaveatsBanner({ caveats }: { caveats: string[] }) {
  return (
    <div className="rounded p-4" style={{ background: 'rgba(255,159,10,.1)', border: 'var(--hairline) solid rgba(255,159,10,.3)' }}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} />
        <div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--orange)' }}>
            What this view does NOT yet show
          </h3>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,159,10,.8)' }}>
            The dashboard is honest about its gaps. Each item below is something the operator module isn't yet tracking.
          </p>
          <ul className="text-xs space-y-0.5" style={{ color: 'rgba(255,159,10,.8)' }}>
            {caveats.map((c, i) => <li key={i}>• {c}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatMoney(minor: number, currency: string): string {
  // Common currencies and their decimal exponents
  const exponent = currency === 'JPY' || currency === 'KRW' ? 0 : 2;
  const major = minor / Math.pow(10, exponent);
  if (currency === 'USD') return `$${major.toFixed(exponent)}`;
  if (currency === 'EUR') return `€${major.toFixed(exponent)}`;
  if (currency === 'GBP') return `£${major.toFixed(exponent)}`;
  if (currency === 'INR') return `₹${major.toFixed(exponent)}`;
  return major.toFixed(exponent);
}

// ─── Complete AND Paid — the 90-day operating system ─────────────────
//
// "Complete" (milestones) reads/writes /api/operator/founder-os directly.
// "Paid" reuses the same payments data RevenueCard above already surfaces,
// just scoped to the 90-day window instead of a trailing 30 days — see
// src/operator/founder-os.ts's getOsView(), which reads localPaymentsAdapter
// rather than keeping a second revenue store.

function CompleteAndPaidSection({
  os, loading, error, onRefresh,
}: {
  os: FounderOsView | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [hoursInput, setHoursInput] = useState('');
  const [targetInput, setTargetInput] = useState('');

  useEffect(() => {
    if (!os) return;
    setHoursInput(os.time_budget.weekly_hours != null ? String(os.time_budget.weekly_hours) : '');
    setTargetInput(os.paid.target_minor != null ? String(os.paid.target_minor / 100) : '');
  }, [os]);

  async function addMilestone() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setMutationError(null);
    try {
      const r = await authFetch('/api/operator/founder-os/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), target_date: newDate || undefined }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMutationError(d.error || `Failed to add milestone: HTTP ${r.status}`);
        return;
      }
      setNewTitle('');
      setNewDate('');
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(m: FounderOsMilestone) {
    const next = m.status === 'not_started' ? 'in_progress' : m.status === 'in_progress' ? 'done' : 'not_started';
    setBusy(true);
    setMutationError(null);
    try {
      const r = await authFetch(`/api/operator/founder-os/milestones/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMutationError(d.error || `Failed to update milestone: HTTP ${r.status}`);
        return;
      }
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeMilestone(id: string) {
    setBusy(true);
    setMutationError(null);
    try {
      const r = await authFetch(`/api/operator/founder-os/milestones/${id}`, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) {
        const d = await r.json().catch(() => ({}));
        setMutationError(d.error || `Failed to delete milestone: HTTP ${r.status}`);
        return;
      }
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(patch: Record<string, unknown>) {
    setBusy(true);
    setMutationError(null);
    try {
      const r = await authFetch('/api/operator/founder-os/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMutationError(d.error || `Failed to save: HTTP ${r.status}`);
        return;
      }
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded p-5 mb-6"
      style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', border: 'var(--hairline) solid var(--separator)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Target className="w-4 h-4" style={{ color: 'var(--green-ink)' }} />
          Complete AND Paid
        </h2>
        {os && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Day {os.window.days_elapsed} of {os.window.days_total} · {os.window.days_remaining}d left
          </span>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        The 90-day operating system for a time-starved founder.
      </p>

      {loading && !os && (
        <div className="flex items-center gap-2 py-6 justify-center" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> loading…
        </div>
      )}

      {error && <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>{error}</p>}
      {mutationError && <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>{mutationError}</p>}

      {os && (
        <div className="space-y-5">
          <ProgressBar
            pct={os.window.pct_elapsed}
            color="var(--text-tertiary)"
            label={`Window: ${new Date(os.window.start).toLocaleDateString()} → ${new Date(os.window.end).toLocaleDateString()}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Complete */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Complete</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{os.complete.done}/{os.complete.total}</span>
              </div>
              <ProgressBar pct={os.complete.pct_complete} color="var(--green)" />
              {os.complete.pace_note && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{os.complete.pace_note}</p>
              )}
            </div>

            {/* Paid — reuses the payments adapter RevenueCard above already reads,
                scoped to this window instead of a trailing 30 days. */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Paid</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formatMoney(os.paid.collected_minor, os.paid.currency)}
                  {os.paid.target_minor != null && ` / ${formatMoney(os.paid.target_minor, os.paid.currency)}`}
                </span>
              </div>
              {os.paid.pct_of_target != null ? (
                <ProgressBar pct={os.paid.pct_of_target} color="var(--green)" />
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No revenue target set — see below.</p>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Milestones</p>
            {os.complete.milestones.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No milestones yet. Add the first one below.</p>
            ) : (
              <div>
                {os.complete.milestones.map(m => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    busy={busy}
                    onCycle={() => cycleStatus(m)}
                    onDelete={() => removeMilestone(m.id)}
                  />
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addMilestone(); }}
                placeholder="New milestone…"
                className="flex-1 text-xs px-2 py-1.5 rounded"
                style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)' }}
              />
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="text-xs px-2 py-1.5 rounded"
                style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={addMilestone}
                disabled={busy || !newTitle.trim()}
                className="text-xs px-3 py-1.5 rounded flex items-center gap-1"
                style={{
                  background: 'var(--green)', color: '#fff', border: 'none',
                  cursor: (busy || !newTitle.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (busy || !newTitle.trim()) ? 0.5 : 1,
                }}
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>

          {/* Settings: weekly hours (the "time-starved" input) + revenue target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>Hours/week available</span>
              <input
                type="number"
                min={0}
                value={hoursInput}
                onChange={e => setHoursInput(e.target.value)}
                onBlur={() => {
                  const n = hoursInput === '' ? null : Number(hoursInput);
                  if (n !== os.time_budget.weekly_hours) saveSettings({ weekly_hours_budget: n });
                }}
                className="w-16 text-xs px-2 py-1 rounded"
                style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>Revenue target ({os.paid.currency})</span>
              <input
                type="number"
                min={0}
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                onBlur={() => {
                  const majorUnits = targetInput === '' ? null : Number(targetInput);
                  const minor = majorUnits === null ? null : Math.round(majorUnits * 100);
                  if (minor !== os.paid.target_minor) {
                    saveSettings({ revenue_target_minor: minor, revenue_target_currency: os.paid.currency });
                  }
                }}
                className="w-24 text-xs px-2 py-1 rounded"
                style={{ background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneRow({
  milestone, busy, onCycle, onDelete,
}: {
  milestone: FounderOsMilestone;
  busy: boolean;
  onCycle: () => void;
  onDelete: () => void;
}) {
  const StatusIcon = milestone.status === 'done' ? CheckCircle2 : Circle;
  const iconColor = milestone.status === 'done'
    ? 'var(--green-ink)'
    : milestone.status === 'in_progress'
    ? 'var(--orange)'
    : 'var(--text-tertiary)';
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: 'var(--hairline) solid var(--separator)' }}>
      <button
        onClick={onCycle}
        disabled={busy}
        aria-label={`Cycle status for ${milestone.title} (currently ${milestone.status})`}
        style={{ background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', padding: 4, lineHeight: 0 }}
      >
        <StatusIcon className="w-4 h-4" style={{ color: iconColor }} />
      </button>
      <span
        className="flex-1 text-xs"
        style={{
          color: milestone.status === 'done' ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: milestone.status === 'done' ? 'line-through' : 'none',
        }}
      >
        {milestone.title}
      </span>
      {milestone.target_date && (
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
          <Calendar className="w-3 h-3" />
          {new Date(milestone.target_date).toLocaleDateString()}
        </span>
      )}
      <button
        onClick={onDelete}
        disabled={busy}
        aria-label={`Delete ${milestone.title}`}
        style={{ background: 'none', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', padding: 4, lineHeight: 0 }}
      >
        <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
      </button>
    </div>
  );
}

// ─── ELI5 product readiness ────────────────────────────────────────
//
// The four-bucket explainer: what works, what needs to be added, what will
// mislead if demoed wrong, what it takes to close the gap. The bucket
// contents are editorial judgment, kept in sync by hand — there is no
// honest way to auto-derive "what will mislead someone if you say X" from
// code. The two live numbers (hand-verified coverage, automated-sweep
// coverage) come from GET /api/operator/verification-report and are
// interpolated into the relevant bullets rather than stated separately,
// so the explainer never drifts from what the report actually says.

interface ReadinessItem {
  text: string;
}

function buildWorksNow(report: VerificationReportView | null): ReadinessItem[] {
  const verifyLine = report
    ? `Every practice answer gets checked before being trusted — your ${report.practice_bank.total_items}-item practice bank has a documented check on ${report.headline.hand_verified_coverage_pct.toFixed(0)}% of items (hand cross-checked); the ${report.content_bundle.total_problems}-question exam bank has been through the newer automated math-software sweep on ${report.headline.automated_sweep_coverage_pct.toFixed(0)}% so far.`
    : 'Every practice answer gets checked before being trusted — a cache of known answers, an AI double-check, and now a real math-software cross-check.';
  return [
    { text: 'A student can sign in, chat with an AI tutor, and do fully-graded practice problems (MCQ / MSQ / numeric) with real exam-style marking.' },
    { text: '10 topics are built out end-to-end — explanation, interactive, practice, and a real past exam question each. Linear Algebra is the deepest (26 concepts).' },
    { text: verifyLine },
    { text: 'A "did the AI use the right method, not just get the right number" checker exists now — built and tested. Currently switched off by default; see below.' },
    { text: 'A skill-rating engine tracks how good each student actually is per topic, not just an easy/medium/hard label.' },
    { text: 'This founder page — your own private 90-day OS and, as of today, this very readiness report.' },
  ];
}

const NEEDS_TO_BE_ADDED: ReadinessItem[] = [
  { text: 'Actually running the automated math-check sweep across the whole exam-question bank — it exists in code but is switched off by default (real, ongoing cost once it runs nightly).' },
  { text: 'Switching the method-checker from "built" to "trusted" — watch it on a sample of real problems before relying on its verdicts.' },
  { text: 'A real "pay here" button for students — today there is only a place to record that someone already paid you, not a checkout flow.' },
  { text: 'Real students. Nothing on this page can substitute for that.' },
];

const WONT_WORK_IF_DEMOED_WRONG: ReadinessItem[] = [
  { text: 'Don’t say "everything is verified by real math software" — only the hand-checked practice bank is fully covered; the exam-question bank is not, until the sweep actually runs.' },
  { text: 'Don’t say "we check the method, not just the answer" yet — that checker is off by default, and even switched on it starts as a rough signal, not a trusted verdict, until it’s watched on real content.' },
  { text: 'Clicking "record a payment" expecting a checkout page will confuse a visitor — it’s an admin-only manual entry, not a customer-facing button.' },
];

const WHAT_IT_TAKES: ReadinessItem[] = [
  { text: 'Flip CONTENT_CRON_ENABLED=true (or run npm run content:verify manually) to start the nightly sweep — real ongoing AI/math-software cost, your call to make.' },
  { text: 'Flip VIDHYA_METHOD_CHECK=on once you’ve spot-checked a handful of its verdicts by hand.' },
  { text: 'Pick a payment provider (Stripe / Razorpay / UPI) to wire up a real checkout.' },
  { text: 'Send the outreach emails already on your milestone list above — that’s the only real path to real students.' },
];

function ProductReadinessSection({ report, loading }: { report: VerificationReportView | null; loading: boolean }) {
  return (
    <div
      className="rounded p-5 mb-6"
      style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', border: 'var(--hairline) solid var(--separator)' }}
    >
      <h2 className="text-base font-semibold flex items-center gap-2 mb-1" style={{ color: 'var(--text-primary)' }}>
        <HelpCircle className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        Product readiness, plainly
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        What works today, what still needs adding, what will mislead someone if you demo it wrong, and what it takes to close each gap.
      </p>

      {loading && !report && (
        <div className="flex items-center gap-2 py-3" style={{ color: 'var(--text-tertiary)' }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> loading verification numbers…
        </div>
      )}

      {report && report.content_bundle.total_problems > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Practice bank — hand-verified coverage</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {report.practice_bank.with_verification_method}/{report.practice_bank.total_items}
              </span>
            </div>
            <ProgressBar pct={report.headline.hand_verified_coverage_pct} color="var(--green)" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Exam bank — automated sweep coverage</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {report.content_bundle.wolfram_verified}/{report.content_bundle.total_problems}
              </span>
            </div>
            <ProgressBar pct={report.headline.automated_sweep_coverage_pct} color={report.headline.automated_sweep_coverage_pct > 0 ? 'var(--green)' : 'var(--orange)'} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ReadinessBucket icon={CheckCircle2} tone="var(--green-ink)" title="Works today" items={buildWorksNow(report)} />
        <ReadinessBucket icon={AlertTriangle} tone="var(--orange)" title="Still needs to be added" items={NEEDS_TO_BE_ADDED} />
        <ReadinessBucket icon={XCircle} tone="var(--red)" title="Will mislead if demoed wrong" items={WONT_WORK_IF_DEMOED_WRONG} />
        <ReadinessBucket icon={Wrench} tone="var(--text-secondary)" title="What it takes" items={WHAT_IT_TAKES} />
      </div>
    </div>
  );
}

function ReadinessBucket({ icon: Icon, tone, title, items }: {
  icon: typeof CheckCircle2; tone: string; title: string; items: ReadinessItem[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tone }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: tone }}>{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-xs pl-3"
            style={{ color: 'var(--text-secondary)', borderLeft: `2px solid ${tone}`, opacity: 0.9 }}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The founder's 116-topic content-generation spec (docs/content-spec/,
 * `atomic_id`s like "LA-06") crosswalked against this app's own concept
 * graph (101 `concept_id`s — src/constants/concept-graph.ts). The two
 * spaces are related but not identical; this shows the real coverage
 * rather than asserting they're simply "the same."
 */
function ContentSpecMappingSection({ mapping, loading }: { mapping: MappingCoverageView | null; loading: boolean }) {
  const pct = mapping && mapping.total_atomic_ids > 0
    ? (mapping.mapped / mapping.total_atomic_ids) * 100
    : 0;
  const multiCount = mapping ? Object.keys(mapping.concepts_with_multiple_atomic_ids).length : 0;

  return (
    <div
      className="rounded p-5 mb-6"
      style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', border: 'var(--hairline) solid var(--separator)' }}
    >
      <h2 className="text-base font-semibold flex items-center gap-2 mb-1" style={{ color: 'var(--text-primary)' }}>
        <Link2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        Content spec → concept mapping
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        Every subtopic in the content-generation spec (docs/content-spec/), matched to the real concept it teaches in this app — so generation can look up the right hooks and sequence for a topic instead of guessing.
      </p>

      {loading && !mapping && (
        <div className="flex items-center gap-2 py-3" style={{ color: 'var(--text-tertiary)' }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> loading mapping coverage…
        </div>
      )}

      {mapping && (
        <>
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Spec topics matched to a real concept</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {mapping.mapped}/{mapping.total_atomic_ids}
              </span>
            </div>
            <ProgressBar pct={pct} color="var(--green)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{mapping.mapped}</span> matched — generation for these topics can pull the spec's hooks/sequence directly.
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{mapping.unmapped}</span> not matched — either the topic isn't built yet, or it's a cross-concept skill, not one concept (see below).
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{mapping.concepts_without_atomic_id.length}</span> concepts this app teaches beyond the base spec (mostly the deeper Linear Algebra pass — SVD, spectral theorem, and similar).
            </div>
          </div>

          {multiCount > 0 && (
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              {multiCount} concept{multiCount === 1 ? '' : 's'} fold{multiCount === 1 ? 's' : ''} together more than one spec topic — e.g. all 8 PDE subtopics teach as a single "pde-basics" concept here. Expected, not a gap.
            </p>
          )}

          {mapping.unmapped > 0 && (
            <details style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)' }}>
              <summary style={{ padding: '10px 14px', fontSize: 'var(--text-footnote)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Why the {mapping.unmapped} unmatched topics aren't matched
              </summary>
              <ul className="space-y-2" style={{ padding: '10px 14px', margin: 0, listStyle: 'none' }}>
                {Object.entries(mapping.unmapped_reasons).map(([atomicId, reason]) => (
                  <li key={atomicId} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{atomicId}</span> — {reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function ProgressBar({ pct, color, label }: { pct: number; color: string; label?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      {label && <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>}
      <div className="w-full rounded-full h-1.5" style={{ background: 'var(--surface-fill)' }}>
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${clamped}%`, background: color, transition: 'width var(--dur-base) var(--ease-standard)' }}
        />
      </div>
    </div>
  );
}
