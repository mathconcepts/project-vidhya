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
    switchDemoRole(role);
  };

  return (
    <div
      role="toolbar"
      aria-label="Demo theater role switcher"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        bottom: 'calc(148px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 16,
        background: 'var(--surface-card)',
        border: '2px solid var(--separator)',
        boxShadow: '0 8px 32px rgba(0,0,0,.12)',
        maxWidth: 'calc(100vw - 16px)',
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, marginRight: 4, borderRight: 'var(--hairline) solid var(--separator)', flexShrink: 0 }}>
        <Radio size={16} className="animate-pulse" style={{ color: 'var(--green-ink)' }} aria-hidden="true" />
        <span style={{ fontSize: 14, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '0.06em' }}>DEMO</span>
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
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 'var(--radius-md)',
              whiteSpace: 'nowrap', flexShrink: 0,
              fontSize: 16, fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              background: isActive ? 'var(--green)' : 'var(--surface-fill)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              border: isActive ? 'none' : 'var(--hairline) solid var(--separator)',
            }}
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
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 'var(--radius-md)',
          flexShrink: 0, fontSize: 14, fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-tertiary)', border: 'var(--hairline) solid var(--separator)',
          background: 'var(--surface-fill)', cursor: 'pointer',
        }}
      >
        <RotateCcw size={16} aria-hidden="true" />
        <span>Reset</span>
      </button>
    </div>
  );
}
