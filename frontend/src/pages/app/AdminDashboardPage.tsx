import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown, Shield, Activity, Users, MessageCircle, Smartphone, Key,
  CheckCircle2, Circle, AlertTriangle, TrendingDown, Brain,
  ArrowRight, Loader2, RefreshCw, Sparkles, Settings, FileText, Server,
  FlaskConical, Lock, BookOpen, Terminal, Wand2, Network,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth/client';
import { ContentMaturityCard } from '@/components/admin/ContentMaturityCard';

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
        <AlertTriangle size={24} style={{ color: 'var(--orange)' }} className="mx-auto" />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Admin role required.</p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Your role: {user?.role || 'not signed in'}</p>
      </div>
    );
  }

  const isOwner = user?.role === 'owner';
  const incompleteChecklist = data?.checklist.filter(c => !c.done) || [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Content maturity — whether students are actually getting personalised
          content or the generic fallback. Self-hides for non-admins. */}
      <ContentMaturityCard />

      {/* Journey nudge — soft pointer at the new guided view. Always visible
          for now; once we have data on uptake, can be conditionally hidden. */}
      <div>
        <a
          href="/admin/journey"
          className="block p-3"
          style={{
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(88,86,214,.3)',
            background: 'rgba(88,86,214,.08)',
            textDecoration: 'none',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--indigo-ink)' }}>
                Try the new guided view
              </div>
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                See your setup progress + the next high-leverage move at a glance.
              </div>
            </div>
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--indigo-ink)' }}>Open →</span>
          </div>
        </a>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="flex items-center gap-2"
            style={{
              fontSize: 'var(--text-title2)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.018em',
            }}
          >
            {isOwner
              ? <Crown size={20} style={{ color: 'var(--orange)' }} />
              : <Shield size={20} style={{ color: 'var(--indigo-ink)' }} />}
            {isOwner ? 'Owner' : 'Admin'} Dashboard
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'there'}. Here's what's happening.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2"
          style={{
            borderRadius: 'var(--radius-xs)',
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            lineHeight: 0,
          }}
          aria-label="refresh"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {error && (
        <div
          className="p-3 text-xs"
          style={{
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,59,48,.1)',
            border: 'var(--hairline) solid rgba(255,59,48,.25)',
            color: 'var(--red)',
          }}
        >
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <Loader2 size={14} className="inline animate-spin mr-2" />
          Loading dashboard...
        </div>
      ) : !data ? null : (
        <>
          {/* Setup checklist — only shown if there are incomplete items */}
          {incompleteChecklist.length > 0 && (
            <div
              className="p-4 space-y-3"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(88,86,214,.06)',
                border: 'var(--hairline) solid rgba(88,86,214,.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: 'var(--indigo-ink)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--indigo-ink)' }}>
                  Get started — {data.checklist.filter(c => c.done).length} of {data.checklist.length} done
                </p>
              </div>
              <div className="space-y-1">
                {data.checklist.map(item => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex items-center gap-2.5 px-2 py-1.5 -mx-1"
                    style={{ borderRadius: 'var(--radius-xs)', textDecoration: 'none' }}
                  >
                    {item.done
                      ? <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--green-ink)' }} />
                      : <Circle size={14} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />}
                    <span
                      className="text-xs flex-1"
                      style={item.done
                        ? { color: 'var(--text-tertiary)', textDecoration: 'line-through' }
                        : { color: 'var(--text-primary)' }
                      }
                    >
                      {item.label}
                    </span>
                    {!item.done && (
                      <ArrowRight size={11} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deployment status grid */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Deployment</p>
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
          </div>

          {/* User metrics */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Users size={10} />
              Users — {data.users.total} total
            </p>
            <div className="grid grid-cols-4 gap-2">
              <MetricCard label="Owner" value={data.users.by_role.owner || 0} tone="amber" />
              <MetricCard label="Admins" value={data.users.by_role.admin || 0} tone="violet" />
              <MetricCard label="Teachers" value={data.users.by_role.teacher || 0} tone="emerald" />
              <MetricCard label="Students" value={data.users.by_role.student || 0} tone="neutral" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <MetricCard label="Active today" value={data.users.active_today} tone="emerald" />
              <MetricCard label="Active this week" value={data.users.active_7d} tone="violet" />
              <MetricCard label="New this week" value={data.users.signed_up_7d} tone="neutral" />
            </div>

            {/* 7-day sparkline */}
            <Sparkline points={data.active_users_sparkline} />
          </div>

          {/* Cohort insight — the WOW moment for admins per USER-JOURNEY */}
          {data.cohort.total_students > 0 && (
            <div
              className="p-4 space-y-3"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-card)',
                boxShadow: 'var(--shadow-raise)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <Brain size={10} />
                  Cohort insight
                </p>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{data.cohort.total_students} students</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Average mastery</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--indigo-ink)' }}>{Math.round(data.cohort.avg_mastery * 100)}%</p>
                </div>
                {data.cohort.flagged_for_teacher_attention > 0 && (
                  <Link
                    to="/teacher/roster"
                    className="px-3 py-2 inline-flex items-center gap-1.5 text-xs"
                    style={{
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255,159,10,.1)',
                      border: 'var(--hairline) solid rgba(255,159,10,.25)',
                      color: 'var(--orange)',
                      textDecoration: 'none',
                    }}
                  >
                    <AlertTriangle size={11} />
                    {data.cohort.flagged_for_teacher_attention} need attention
                  </Link>
                )}
              </div>

              {data.cohort.struggling_concepts.length > 0 && (
                <div className="pt-2" style={{ borderTop: 'var(--hairline) solid var(--separator)' }}>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--text-tertiary)' }}>Top struggling concepts</p>
                  <div className="space-y-1">
                    {data.cohort.struggling_concepts.slice(0, 5).map(c => (
                      <div key={c.concept_id} className="flex items-center gap-2 text-xs">
                        <TrendingDown size={10} className="shrink-0" style={{ color: 'var(--orange)' }} />
                        <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                          {c.concept_id.replace(/-/g, ' ')}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {c.students_affected} students · {Math.round(c.avg_mastery * 100)}% avg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(data.cohort.frustrated_count > 0 || data.cohort.anxious_count > 0) && (
                <div
                  className="pt-2 text-[11px]"
                  style={{ borderTop: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' }}
                >
                  {data.cohort.frustrated_count > 0 && <span className="mr-3">{data.cohort.frustrated_count} frustrated</span>}
                  {data.cohort.anxious_count > 0 && <span>{data.cohort.anxious_count} anxious</span>}
                </div>
              )}
            </div>
          )}

          {/* Empty cohort — show gentle encouragement instead */}
          {data.cohort.total_students === 0 && data.users.by_role.student === 0 && (
            <div
              className="p-4 text-center space-y-2"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-card)',
                boxShadow: 'var(--shadow-raise)',
              }}
            >
              <Brain size={24} className="mx-auto" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No student data yet</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Cohort insights will appear here once students start using the app.
              </p>
            </div>
          )}

          {/* Quick links */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Admin pages</p>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href="/admin/users" label="User management" icon={Users} />
              <QuickLink href="/admin/features" label="Feature flags" icon={Settings} />
              <QuickLink href="/admin/content-studio" label="Content studio" icon={FileText} />
              <QuickLink href="/admin/content-rd" label="Content R&D" icon={FlaskConical} />
              <QuickLink href="/admin/holdout" label="Holdout PYQs" icon={Lock} />
              <QuickLink href="/admin/platform-health" label="Platform health" icon={Server} />
              <QuickLink href="/admin/jobs" label="Run console" icon={Terminal} />
              <QuickLink href="/admin/setup" label="Setup wizard" icon={Wand2} />
              <QuickLink href="/admin/graph" label="Graph browser" icon={Network} />
              <QuickLink href="/admin/scenarios" label="Persona scenarios" icon={Sparkles} />
              <QuickLink href="/admin/blueprints" label="Content blueprints" icon={FileText} />
              <QuickLink href="/admin/playbooks" label="Playbooks" icon={Terminal} />
              <QuickLink href="/admin/rulesets" label="Blueprint rulesets" icon={Settings} />
              <QuickLink href="/admin/decisions" label="Decision log" icon={FileText} />
              <QuickLink href="/admin/cohort" label="Cohort attention" icon={Users} />
              <QuickLink href="/admin/exam-packs" label="Exam packs" icon={BookOpen} />
              <QuickLink href="/admin/syllabus-bridge" label="Syllabus bridge" icon={BookOpen} />
              <QuickLink href="/admin/founder" label="Founder dashboard" icon={Server} />
              <QuickLink href="/teacher/roster" label="Teacher roster" icon={Brain} />
              <QuickLink href="/teacher/syllabus-coverage" label="Class syllabus coverage" icon={Brain} />
              <QuickLink href="/llm-config" label="AI config" icon={Key} />
              {isOwner && <QuickLink href="/owner/settings" label="Owner settings" icon={Crown} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================

function StatusCard({ icon: Icon, label, value, good, href }: {
  icon: typeof Key; label: string; value: string; good: boolean; href?: string;
}) {
  const cardStyle = {
    padding: '0.625rem',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--surface-card)',
    boxShadow: 'var(--shadow-raise)',
    display: 'block',
  };
  const body = (
    <>
      <div className="flex items-center justify-between">
        <Icon size={12} style={{ color: good ? 'var(--green-ink)' : 'var(--text-tertiary)' }} />
        <span
          className="w-1.5 h-1.5"
          style={{
            display: 'inline-block',
            borderRadius: '50%',
            background: good ? 'var(--green)' : 'var(--separator)',
          }}
        />
      </div>
      <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-xs font-medium" style={{ color: good ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{value}</p>
    </>
  );
  if (href) {
    return (
      <Link to={href} style={{ ...cardStyle, textDecoration: 'none' }}>
        {body}
      </Link>
    );
  }
  return <div style={cardStyle}>{body}</div>;
}

function MetricCard({ label, value, tone }: {
  label: string; value: number; tone: 'amber' | 'violet' | 'emerald' | 'neutral';
}) {
  const valueColor =
    tone === 'amber' ? 'var(--orange)'
    : tone === 'violet' ? 'var(--indigo-ink)'
    : tone === 'emerald' ? 'var(--green-ink)'
    : 'var(--text-primary)';
  return (
    <div
      className="p-2.5 text-center"
      style={{
        borderRadius: 'var(--radius-xs)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-raise)',
      }}
    >
      <p className="text-xl font-bold" style={{ color: valueColor }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
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
          className="flex-1 min-h-[2px] transition-all"
          style={{
            height: `${Math.max(8, (p / max) * 100)}%`,
            background: 'rgba(88,86,214,.3)',
            borderRadius: '2px',
          }}
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
    <Link
      to={href}
      className="p-3 flex items-center gap-2 text-xs"
      style={{
        borderRadius: 'var(--radius-xs)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-raise)',
        color: 'var(--text-primary)',
        textDecoration: 'none',
      }}
    >
      <Icon size={12} style={{ color: 'var(--text-tertiary)' }} />
      <span className="flex-1">{label}</span>
      <ArrowRight size={11} style={{ color: 'var(--text-tertiary)' }} />
    </Link>
  );
}
