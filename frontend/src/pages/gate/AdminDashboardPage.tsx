import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Crown, Shield, Activity, Users, MessageCircle, Smartphone, Key,
  CheckCircle2, Circle, AlertTriangle, TrendingDown, Brain,
  ArrowRight, Loader2, RefreshCw, Sparkles, Settings, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface DashboardSummary {
  deployment: {
    channels: { web: boolean; telegram: boolean; whatsapp: boolean };
    llm_configured: boolean;
    llm_provider: string | null;
  };
  users: {
    total: number;
    by_role: Record<string, number>;
    active_today: number;
    active_7d: number;
    signed_up_7d: number;
  };
  cohort: {
    total_students: number;
    avg_mastery: number;
    struggling_concepts: Array<{ concept_id: string; students_affected: number; avg_mastery: number }>;
    frustrated_count: number;
    anxious_count: number;
    flagged_for_teacher_attention: number;
  };
  active_users_sparkline: number[];
  checklist: Array<{ id: string; label: string; done: boolean; href: string }>;
}

export default function AdminDashboardPage() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch('/api/admin/dashboard-summary');
      if (r.status === 403) { setError('Admin role required.'); return; }
      if (!r.ok) { setError(`HTTP ${r.status}`); return; }
      setData(await r.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (hasRole('admin')) refresh(); else setLoading(false); }, [hasRole, refresh]);

  if (!hasRole('admin')) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-2">
        <AlertTriangle size={24} className="text-amber-400 mx-auto" />
        <p className="text-sm text-surface-300">Admin role required.</p>
        <p className="text-xs text-surface-500">Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  const isOwner = user?.role === 'owner';
  const incompleteChecklist = data?.checklist.filter(c => !c.done) || [];

  return (
    <motion.div className="space-y-5 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
            {isOwner ? <Crown size={20} className="text-amber-400" /> : <Shield size={20} className="text-sky-400" />}
            {isOwner ? 'Owner' : 'Admin'} Dashboard
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}. Here's what's happening.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200"
          aria-label="refresh"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          {error}
        </motion.div>
      )}

      {loading && !data ? (
        <div className="text-center py-12 text-surface-500 text-sm">
          <Loader2 size={14} className="inline animate-spin mr-2" />
          Loading dashboard...
        </div>
      ) : !data ? null : (
        <>
          {/* Setup checklist — only shown if there are incomplete items */}
          {incompleteChecklist.length > 0 && (
            <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-gradient-to-br from-sky-500/5 to-emerald-500/5 border border-sky-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-sky-400" />
                <p className="text-sm font-medium text-sky-200">
                  Get started — {data.checklist.filter(c => c.done).length} of {data.checklist.length} done
                </p>
              </div>
              <div className="space-y-1">
                {data.checklist.map(item => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex items-center gap-2.5 px-2 py-1.5 -mx-1 rounded-lg hover:bg-surface-900/60 transition-colors group"
                  >
                    {item.done
                      ? <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                      : <Circle size={14} className="shrink-0 text-surface-600 group-hover:text-sky-400" />}
                    <span className={clsx(
                      'text-xs flex-1',
                      item.done ? 'text-surface-500 line-through' : 'text-surface-200 group-hover:text-sky-200'
                    )}>
                      {item.label}
                    </span>
                    {!item.done && (
                      <ArrowRight size={11} className="text-surface-600 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Deployment status grid */}
          <motion.div variants={fadeInUp} className="space-y-2">
            <p className="text-[10px] text-surface-500 uppercase tracking-wide">Deployment</p>
            <div className="grid grid-cols-2 gap-2">
              <StatusCard
                icon={Key}
                label="AI provider"
                value={data.deployment.llm_configured ? (data.deployment.llm_provider || 'configured') : 'not set'}
                good={data.deployment.llm_configured}
                href="/llm-config"
              />
              <StatusCard
                icon={Smartphone}
                label="Web"
                value="always on"
                good={true}
              />
              <StatusCard
                icon={MessageCircle}
                label="Telegram"
                value={data.deployment.channels.telegram ? 'connected' : 'not configured'}
                good={data.deployment.channels.telegram}
                href="/owner/settings"
              />
              <StatusCard
                icon={MessageCircle}
                label="WhatsApp"
                value={data.deployment.channels.whatsapp ? 'connected' : 'not configured'}
                good={data.deployment.channels.whatsapp}
                href="/owner/settings"
              />
            </div>
          </motion.div>

          {/* User metrics */}
          <motion.div variants={fadeInUp} className="space-y-2">
            <p className="text-[10px] text-surface-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={10} />
              Users — {data.users.total} total
            </p>
            <div className="grid grid-cols-4 gap-2">
              <MetricCard label="Owner" value={data.users.by_role.owner || 0} tone="amber" />
              <MetricCard label="Admins" value={data.users.by_role.admin || 0} tone="sky" />
              <MetricCard label="Teachers" value={data.users.by_role.teacher || 0} tone="emerald" />
              <MetricCard label="Students" value={data.users.by_role.student || 0} tone="neutral" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <MetricCard label="Active today" value={data.users.active_today} tone="emerald" />
              <MetricCard label="Active this week" value={data.users.active_7d} tone="sky" />
              <MetricCard label="New this week" value={data.users.signed_up_7d} tone="neutral" />
            </div>

            {/* 7-day sparkline */}
            <Sparkline points={data.active_users_sparkline} />
          </motion.div>

          {/* Cohort insight — the WOW moment for admins per USER-JOURNEY */}
          {data.cohort.total_students > 0 && (
            <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-surface-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Brain size={10} />
                  Cohort insight
                </p>
                <span className="text-[10px] text-surface-600">{data.cohort.total_students} students</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-surface-500">Average mastery</p>
                  <p className="text-2xl font-bold text-sky-300">{Math.round(data.cohort.avg_mastery * 100)}%</p>
                </div>
                {data.cohort.flagged_for_teacher_attention > 0 && (
                  <Link
                    to="/teacher/roster"
                    className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:text-amber-200 inline-flex items-center gap-1.5 text-xs"
                  >
                    <AlertTriangle size={11} />
                    {data.cohort.flagged_for_teacher_attention} need attention
                  </Link>
                )}
              </div>

              {data.cohort.struggling_concepts.length > 0 && (
                <div className="pt-2 border-t border-surface-800">
                  <p className="text-[10px] text-surface-500 mb-2">Top struggling concepts</p>
                  <div className="space-y-1">
                    {data.cohort.struggling_concepts.slice(0, 5).map(c => (
                      <div key={c.concept_id} className="flex items-center gap-2 text-xs">
                        <TrendingDown size={10} className="shrink-0 text-amber-400" />
                        <span className="flex-1 text-surface-300 truncate">
                          {c.concept_id.replace(/-/g, ' ')}
                        </span>
                        <span className="text-surface-500 text-[10px]">
                          {c.students_affected} students · {Math.round(c.avg_mastery * 100)}% avg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(data.cohort.frustrated_count > 0 || data.cohort.anxious_count > 0) && (
                <div className="pt-2 border-t border-surface-800 text-[11px] text-surface-400">
                  {data.cohort.frustrated_count > 0 && <span className="mr-3">{data.cohort.frustrated_count} frustrated</span>}
                  {data.cohort.anxious_count > 0 && <span>{data.cohort.anxious_count} anxious</span>}
                </div>
              )}
            </motion.div>
          )}

          {/* Empty cohort — show gentle encouragement instead */}
          {data.cohort.total_students === 0 && data.users.by_role.student === 0 && (
            <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-surface-900 border border-surface-800 text-center space-y-2">
              <Brain size={24} className="text-surface-600 mx-auto" />
              <p className="text-sm text-surface-300">No student data yet</p>
              <p className="text-xs text-surface-500">
                Cohort insights will appear here once students start using the app.
              </p>
            </motion.div>
          )}

          {/* Quick links */}
          <motion.div variants={fadeInUp} className="space-y-2">
            <p className="text-[10px] text-surface-500 uppercase tracking-wide">Admin pages</p>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href="/admin/users" label="User management" icon={Users} />
              <QuickLink href="/admin/features" label="Feature flags" icon={Settings} />
              <QuickLink href="/admin/content-studio" label="Content studio" icon={FileText} />
              <QuickLink href="/teacher/roster" label="Teacher roster" icon={Brain} />
              <QuickLink href="/llm-config" label="AI config" icon={Key} />
              {isOwner && <QuickLink href="/owner/settings" label="Owner settings" icon={Crown} />}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// ============================================================================

function StatusCard({ icon: Icon, label, value, good, href }: {
  icon: typeof Key; label: string; value: string; good: boolean; href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <Icon size={12} className={good ? 'text-emerald-400' : 'text-surface-600'} />
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          good ? 'bg-emerald-400' : 'bg-surface-700'
        )} />
      </div>
      <p className="text-[10px] text-surface-500 mt-1">{label}</p>
      <p className={clsx('text-xs font-medium', good ? 'text-surface-200' : 'text-surface-500')}>{value}</p>
    </>
  );
  if (href) {
    return (
      <Link to={href} className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 hover:border-surface-700 transition-colors block">
        {body}
      </Link>
    );
  }
  return <div className="p-2.5 rounded-lg bg-surface-900 border border-surface-800">{body}</div>;
}

function MetricCard({ label, value, tone }: {
  label: string; value: number; tone: 'amber' | 'sky' | 'emerald' | 'neutral';
}) {
  const toneClass =
    tone === 'amber' ? 'text-amber-300'
    : tone === 'sky' ? 'text-sky-300'
    : tone === 'emerald' ? 'text-emerald-300'
    : 'text-surface-200';
  return (
    <div className="p-2.5 rounded-lg bg-surface-900 border border-surface-800 text-center">
      <p className={clsx('text-xl font-bold', toneClass)}>{value}</p>
      <p className="text-[10px] text-surface-500">{label}</p>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (!points || points.length === 0) return null;
  const max = Math.max(1, ...points);
  return (
    <div className="flex items-end gap-0.5 h-8 pt-1" aria-label="7-day active users">
      {points.map((p, i) => (
        <div
          key={i}
          className="flex-1 bg-sky-500/30 rounded-sm min-h-[2px] transition-all"
          style={{ height: `${Math.max(8, (p / max) * 100)}%` }}
          title={`${p} active ${i === 6 ? 'today' : `${6 - i} day${6 - i !== 1 ? 's' : ''} ago`}`}
        />
      ))}
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: {
  href: string; label: string; icon: typeof Key;
}) {
  return (
    <Link to={href} className="p-3 rounded-lg bg-surface-900 border border-surface-800 hover:border-sky-500/40 flex items-center gap-2 text-xs text-surface-200 transition-colors group">
      <Icon size={12} className="text-surface-500 group-hover:text-sky-400" />
      <span className="flex-1">{label}</span>
      <ArrowRight size={11} className="text-surface-600 group-hover:text-sky-400" />
    </Link>
  );
}
