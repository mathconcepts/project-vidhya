import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, RefreshCw, AlertCircle, AlertTriangle,
  Users, DollarSign, Activity, Coins, Server, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp } from '@/lib/animations';

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
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="w-5 h-5" />
          <span>Admin role required to view the founder dashboard.</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-6 max-w-6xl mx-auto"
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-100 flex items-center gap-2">
            <Server className="w-6 h-6" />
            Founder dashboard
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Single-screen view of users, revenue, activity, cost, and module health.
            See <code className="text-surface-300">FOUNDER.md</code> for the operations runbook.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-surface-400 hover:text-surface-200 disabled:opacity-50"
          aria-label="refresh"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </header>

      {loading && !data && (
        <div className="flex items-center gap-2 text-surface-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> loading dashboard…
        </div>
      )}

      {error && (
        <div className="bg-rose-900/20 border border-rose-800/50 rounded p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-200 text-sm">{error}</p>
            <button
              onClick={refresh}
              className="text-xs text-rose-300 underline mt-1 hover:text-rose-200"
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

          {/* Module health table */}
          <HealthTable
            modules={data.health.modules}
            tests_status={data.health.tests_status}
          />

          {/* Footer with generated_at */}
          <p className="text-xs text-surface-500 text-right">
            Generated at {new Date(data.generated_at).toLocaleString()}
          </p>
        </div>
      )}
    </motion.div>
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
    <div className="bg-surface-900 border border-surface-800 rounded p-4 flex flex-col">
      <div className="flex items-center gap-2 text-xs text-surface-400 mb-3">
        <Icon className="w-4 h-4" />
        <span className="font-medium uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex-1">
        {children}
      </div>
      {footer && (
        <div className="text-xs text-surface-500 mt-3 pt-2 border-t border-surface-800">
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
      <div className="text-3xl font-semibold text-surface-100">{users.total}</div>
      <div className="text-xs text-surface-400 mt-1">
        {users.active_7d} active in last 7 days
      </div>
      <div className="text-xs text-surface-400">
        {users.new_30d} new in last 30 days
      </div>
      {roles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {roles.map(([role, n]) => (
            <span
              key={role}
              className="text-xs bg-surface-800 text-surface-300 px-2 py-0.5 rounded font-mono"
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
        <div className="text-2xl font-semibold text-surface-500">—</div>
        <div className="text-xs text-surface-500 mt-1">
          No payments recorded yet.
        </div>
        <div className="text-xs text-surface-500 mt-1">
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
          <span className="text-3xl font-semibold text-surface-100">
            {formatMoney(minor, currency)}
          </span>
          <span className="text-xs text-surface-500 ml-1">{currency}</span>
        </div>
      ))}
      <div className="text-xs text-surface-400 mt-2">
        {revenue.paid_users_30d} paid {revenue.paid_users_30d === 1 ? 'user' : 'users'}
      </div>
      {revenue.paid_users_30d > 0 && Object.entries(revenue.arpu_30d).map(([currency, minor]) => (
        <div key={currency} className="text-xs text-surface-400">
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
      <span className="text-xs text-surface-400">{label}</span>
      <span className="text-sm font-mono text-surface-200">{value.toLocaleString()}</span>
    </div>
  );
}

function CostCard({ cost }: { cost: FounderDashboard['cost'] }) {
  return (
    <Card icon={Coins} title="LLM Cost (7d)">
      <div className="text-3xl font-semibold text-surface-100">
        {(cost.llm_tokens_7d / 1000).toFixed(1)}k
      </div>
      <div className="text-xs text-surface-400 mt-1">tokens estimated</div>
      <div className="mt-2 text-xs text-surface-400">
        {cost.llm_estimated_usd_7d !== null
          ? `~$${cost.llm_estimated_usd_7d.toFixed(2)} USD`
          : 'No pricing model configured'}
      </div>
      {cost.budget_used_today > 0 && (
        <div className="mt-2 text-xs text-surface-400">
          {cost.budget_used_today.toLocaleString()} tokens used today
        </div>
      )}
    </Card>
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
    <div className="bg-surface-900 border border-surface-800 rounded">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2 text-xs text-surface-400">
          <Server className="w-4 h-4" />
          <span className="font-medium uppercase tracking-wider">
            Module health ({modules.length})
          </span>
        </div>
        <span className="text-xs text-surface-500 font-mono">
          tests: {tests_status}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {modules.map(m => (
            <tr key={m.name} className="border-t border-surface-800/50">
              <td className="px-4 py-2 font-mono text-xs text-surface-300 w-40">
                {m.name}
              </td>
              <td className="px-2 py-2 w-24">
                <HealthBadge status={m.status} />
              </td>
              <td className="px-4 py-2 text-xs text-surface-400">
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
  const styles: Record<string, string> = {
    healthy:     'bg-emerald-900/30 text-emerald-300 border-emerald-800/50',
    degraded:    'bg-amber-900/30 text-amber-300 border-amber-800/50',
    unavailable: 'bg-rose-900/30 text-rose-300 border-rose-800/50',
  };
  const cls = styles[status] || 'bg-surface-800 text-surface-400 border-surface-700';
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded border', cls)}>
      {status}
    </span>
  );
}

// ─── Caveats banner ─────────────────────────────────────────────────

function CaveatsBanner({ caveats }: { caveats: string[] }) {
  return (
    <div className="bg-amber-900/15 border border-amber-800/40 rounded p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-amber-200 mb-1">
            What this view does NOT yet show
          </h3>
          <p className="text-xs text-amber-300/80 mb-2">
            The dashboard is honest about its gaps. Each item below is something the operator module isn't yet tracking.
          </p>
          <ul className="text-xs text-amber-200/80 space-y-0.5">
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
