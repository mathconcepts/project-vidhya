import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, RefreshCw, AlertCircle, AlertTriangle,
  Users, DollarSign, Activity, Coins, Server, FileText,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';

/**
 * /gate/admin/founder — solo-founder dashboard.
 *
 * Renders /api/operator/dashboard as a single-screen view of the
 * metrics a solo founder cares about: users, revenue, activity,
 * LLM cost, module health.
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

export default function FounderDashboardPage() {
  const { hasRole } = useAuth();
  const [data, setData]       = useState<FounderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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

  useEffect(() => { refresh(); }, [refresh]);

  if (!hasRole('admin')) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2" style={{ color: 'var(--red)' }}>
          <AlertCircle className="w-5 h-5" />
          <span>Admin role required to view the founder dashboard.</span>
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
            Single-screen view of users, revenue, activity, cost, and module health.
            See <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>FOUNDER.md</code> for the operations runbook.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
          aria-label="refresh"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
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
    ? { background: 'rgba(255,149,0,.1)', color: 'var(--orange)', border: '1px solid rgba(255,149,0,.3)' }
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
    <div className="rounded p-4" style={{ background: 'rgba(255,149,0,.1)', border: 'var(--hairline) solid rgba(255,149,0,.3)' }}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} />
        <div>
          <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--orange)' }}>
            What this view does NOT yet show
          </h3>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,149,0,.8)' }}>
            The dashboard is honest about its gaps. Each item below is something the operator module isn't yet tracking.
          </p>
          <ul className="text-xs space-y-0.5" style={{ color: 'rgba(255,149,0,.8)' }}>
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
