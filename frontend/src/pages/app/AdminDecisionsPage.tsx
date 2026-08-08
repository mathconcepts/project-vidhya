/**
 * AdminDecisionsPage — the chronological decision log at /admin/decisions.
 *
 * Answers: "what did I do this week?" — by reading existing
 * created_at + created_by columns across blueprint_rulesets,
 * content_blueprints, and generation_runs. No new tables.
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Lock, Filter, BookOpen, FileText, Sparkles, Rocket, ScrollText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import { listDecisions, type DecisionRow, type DecisionKind } from '@/api/admin/decisions';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

const KIND_META: Record<DecisionKind, { label: string; icon: typeof BookOpen; color: string }> = {
  ruleset_created:    { label: 'Ruleset',    icon: BookOpen,  color: 'var(--orange)' },
  blueprint_created:  { label: 'Blueprint',  icon: FileText,  color: 'var(--indigo-ink)' },
  blueprint_approved: { label: 'Approved',   icon: Sparkles,  color: 'var(--green-ink)' },
  run_launched:       { label: 'Run',        icon: Rocket,    color: 'var(--indigo-ink)' },
};

const ALL_KINDS: DecisionKind[] = ['ruleset_created', 'blueprint_created', 'blueprint_approved', 'run_launched'];

export default function AdminDecisionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [decisions, setDecisions] = useState<DecisionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeKinds, setActiveKinds] = useState<Set<DecisionKind>>(new Set(ALL_KINDS));

  useEffect(() => {
    if (authLoading || !user || !isAdminRole(user.role)) return;
    listDecisions(100).then(setDecisions).catch((e) => setError((e as Error).message));
  }, [authLoading, user]);

  const filtered = useMemo(() => {
    if (!decisions) return null;
    return decisions.filter((d) => activeKinds.has(d.kind));
  }, [decisions, activeKinds]);

  const grouped = useMemo(() => {
    if (!filtered) return [];
    const map = new Map<string, DecisionRow[]>();
    for (const d of filtered) {
      const day = d.at.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(d);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }
  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ maxWidth: 448, margin: '80px auto', padding: 24, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', textAlign: 'center' }}>
        <Lock size={28} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Admin only</p>
      </div>
    );
  }

  const toggle = (k: DecisionKind) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 0' }}>
      <JourneyNudge currentHref="/admin/decisions" />

      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--indigo-ink)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          <ScrollText size={14} /> Decision log
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          What you did, when you did it
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Every blueprint, ruleset, approval, and run launch — newest first. Click through to the source.
        </p>
      </header>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Filter size={11} style={{ color: 'var(--text-tertiary)' }} />
        {ALL_KINDS.map((k) => {
          const meta = KIND_META[k];
          const on = activeKinds.has(k);
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: on ? '1px solid rgba(88,86,214,.3)' : 'var(--hairline) solid var(--separator)',
                background: on ? 'rgba(88,86,214,.08)' : 'var(--surface-card)',
                color: on ? meta.color : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>{error}</div>
      )}

      {filtered === null && <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Loading…</div>}
      {filtered && filtered.length === 0 && (
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0' }}>
          No decisions yet. Visit <Link to="/admin/journey" style={{ color: 'var(--indigo-ink)' }}>the journey dashboard</Link> for what to do first.
        </div>
      )}

      {grouped.map(([day, rows]) => (
        <motion.section key={day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{day}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rows.map((r, i) => {
              const meta = KIND_META[r.kind];
              const Icon = meta.icon;
              const time = r.at.slice(11, 16);
              return (
                <li
                  key={`${r.kind}-${r.ref_id}-${i}`}
                  style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                >
                  <Icon size={14} style={{ marginTop: 2, flexShrink: 0, color: meta.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      {time} · {meta.label} · {r.actor}
                    </div>
                    <Link
                      to={r.href}
                      style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}
                    >
                      {r.summary}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      ))}
    </div>
  );
}
