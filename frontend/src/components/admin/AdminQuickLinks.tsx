import { Link } from 'react-router-dom';
import {
  Crown, Users, Sparkles, Settings, FileText, Server,
  FlaskConical, Lock, BookOpen, Terminal, Wand2, Network, ClipboardCheck,
  Play, Brain, Key, ArrowRight,
} from 'lucide-react';

/**
 * The full admin-pages quick-link grid.
 *
 * Shared by AdminDashboardPage and FounderDashboardPage so the founder
 * page is a literal navigation superset of admin — every link an admin
 * can reach, a founder can reach too, from one shared list rather than
 * two copies that can drift.
 *
 * `isOwner` controls the one owner-only entry (Owner settings — role
 * transfer, "master rights"). Admin never sees it.
 */
export function AdminQuickLinks({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Admin pages</p>
      <div className="grid grid-cols-2 gap-2">
        <QuickLink href="/admin/walkthrough" label="Demo walkthrough" icon={Play} />
        <QuickLink href="/admin/users" label="User management" icon={Users} />
        <QuickLink href="/admin/features" label="Feature flags" icon={Settings} />
        <QuickLink href="/admin/content-studio" label="Content studio" icon={FileText} />
        <QuickLink href="/admin/content-rd" label="Content R&D" icon={FlaskConical} />
        <QuickLink href="/admin/holdout" label="Holdout PYQs" icon={Lock} />
        <QuickLink href="/admin/review-queue" label="Answer-key review" icon={ClipboardCheck} />
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
