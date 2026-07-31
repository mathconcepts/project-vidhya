/**
 * DemoRoleSwitcher — persistent, projector-legible role control for
 * Demo Theater mode (`?demo`, backlog U1-9; UX-100x-Touchpoint-Design.md §7).
 *
 * Render this ONCE, app-wide, only when `isDemoMode()` is true — see the
 * U1-9 delivery report for the exact AppLayout integration snippet.
 *
 * Lets a presenter flip between Student / Teacher / Parent / Admin
 * without touching a keyboard:
 *
 *   - Student / Teacher / Admin re-use the real `/demo-login?role=...`
 *     flow (Priya / Kavita / Arjun, seeded by demo/seed.ts) — the same
 *     accounts SignInPage's "Local dev quick start" panel signs into.
 *     These are real sign-ins, not simulated ones.
 *   - Parent has no backend account (auth.parent_role is feature-flagged
 *     off; demo/seed.ts never mints one) — so it's a client-side-only
 *     lens onto /digest, the parent-facing "digest image" touchpoint
 *     from the UX design doc. Always shown with the Sample data chip.
 *
 * Projector-legible: type sizes here (16-18px labels) are deliberately
 * above normal UI-chrome scale (DESIGN-SYSTEM.md's 10-13px nav/label
 * range) — this control is presenter-facing, read from across a room
 * during a live conversation, not mobile student chrome.
 */

import { useState } from 'react';
import { GraduationCap, Heart, Shield, BookOpen, RotateCcw, Radio } from 'lucide-react';
import {
  DEMO_ROLES,
  type DemoRole,
  getDemoRole,
  switchDemoRole,
  resetDemoMode,
  isSeededRole,
} from '@/lib/demoMode';
import { SampleDataChip } from '@/components/app/SampleDataChip';

const ROLE_META: Record<DemoRole, { label: string; icon: typeof BookOpen }> = {
  student: { label: 'Student', icon: BookOpen },
  teacher: { label: 'Teacher', icon: GraduationCap },
  parent: { label: 'Parent', icon: Heart },
  admin: { label: 'Admin', icon: Shield },
};

export function DemoRoleSwitcher() {
  const [active, setActive] = useState<DemoRole>(getDemoRole());

  const handleSelect = (role: DemoRole) => {
    if (role === active) return;
    setActive(role);
    switchDemoRole(role); // full navigation for student/teacher/admin; SPA nav for parent
  };

  return (
    <div
      role="toolbar"
      aria-label="Demo theater role switcher"
      className={[
        'fixed left-1/2 -translate-x-1/2 z-[60]',
        'flex items-center gap-2 px-3 py-2.5 rounded-2xl',
        'bg-surface-950 border-2 border-surface-700 shadow-2xl shadow-black/50',
        'max-w-[calc(100vw-16px)] overflow-x-auto',
      ].join(' ')}
      style={{ bottom: 'calc(148px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-surface-800 shrink-0">
        <Radio size={16} className="text-emerald-400 animate-pulse" aria-hidden="true" />
        <span className="text-sm font-bold text-surface-200 tracking-wide hidden sm:inline">DEMO</span>
      </div>

      {DEMO_ROLES.map((role) => {
        const meta = ROLE_META[role];
        const isActive = role === active;
        return (
          <button
            key={role}
            type="button"
            onClick={() => handleSelect(role)}
            aria-pressed={isActive}
            className={[
              'flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0',
              'text-base font-semibold transition-colors touch-manipulation',
              isActive
                ? 'bg-emerald-500 text-surface-950'
                : 'bg-surface-900 text-surface-200 border border-surface-700 hover:bg-surface-800',
            ].join(' ')}
          >
            <meta.icon size={18} strokeWidth={2.25} aria-hidden="true" />
            {meta.label}
          </button>
        );
      })}

      {isSeededRole(active) && <SampleDataChip className="shrink-0" />}

      <button
        type="button"
        onClick={resetDemoMode}
        title="Reset demo — clears session, back to a clean start"
        className={[
          'flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0',
          'text-sm font-semibold text-surface-400 border border-surface-800',
          'hover:text-surface-100 hover:bg-surface-800 transition-colors touch-manipulation',
        ].join(' ')}
      >
        <RotateCcw size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
}
