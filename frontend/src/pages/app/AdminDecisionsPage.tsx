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
import { listDecisions, type DecisionRow, type DecisionKind } from '@/api/admin/decisions';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

const KIND_META: Record<DecisionKind, { label: string; icon: typeof BookOpen; color: string }> = {
  ruleset_created:    { label: 'Ruleset',    icon: BookOpen,  color: 'text-amber-300' },
  blueprint_created:  { label: 'Blueprint',  icon: FileText,  color: 'text-violet-300' },
  blueprint_approved: { label: 'Approved',   icon: Sparkles,  color: 'text-emerald-300' },
  run_launched:       { label: 'Run',        icon: Rocket,    color: 'text-cyan-300' },
};

const ALL_KINDS: DecisionKind[] = ['ruleset_created', 'blueprint_created', 'blueprint_approved', 'run_launched'];

export default function AdminDecisionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [decisions, setDecisions] = useState<DecisionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeKinds, setActiveKinds] = useState<Set<DecisionKind>>(new Set(ALL_KINDS));

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
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
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-400" /></div>;
  }
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border border-surface-800 bg-surface-900 text-center">
        <Lock size={28} className="mx-auto text-surface-500 mb-3" />
        <p className="text-surface-200 font-medium mb-1">Admin only</p>
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <JourneyNudge currentHref="/admin/decisions" />

      <header className="mb-6">
        <div className="flex items-center gap-2 text-violet-400 text-xs uppercase tracking-wider mb-2">
          <ScrollText size={14} /> Decision log
        </div>
        <h1 className="text-2xl font-display font-semibold text-surface-100">
          What you did, when you did it
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Every blueprint, ruleset, approval, and run launch — newest first. Click through to the source.
        </p>
      </header>

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <Filter size={11} className="text-surface-500" />
        {ALL_KINDS.map((k) => {
          const meta = KIND_META[k];
          const on = activeKinds.has(k);
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`text-xs px-2 py-1 rounded border ${
                on
                  ? `border-violet-500/30 bg-violet-500/10 ${meta.color}`
                  : 'border-surface-800 bg-surface-900 text-surface-500'
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      )}

      {filtered === null && <div className="text-sm text-surface-500">Loading…</div>}
      {filtered && filtered.length === 0 && (
        <div className="text-sm text-surface-500 text-center py-12">
          No decisions yet. Visit <Link to="/admin/journey" className="text-violet-300">the journey dashboard</Link> for what to do first.
        </div>
      )}

      {grouped.map(([day, rows]) => (
        <motion.section key={day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h2 className="text-[10px] uppercase tracking-wider text-surface-600 mb-2">{day}</h2>
          <ul className="space-y-1">
            {rows.map((r, i) => {
              const meta = KIND_META[r.kind];
              const Icon = meta.icon;
              const time = r.at.slice(11, 16);
              return (
                <li key={`${r.kind}-${r.ref_id}-${i}`} className="p-2.5 rounded-lg border border-surface-800 bg-surface-900 flex items-start gap-3">
                  <Icon size={14} className={`mt-0.5 shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-surface-500 mb-0.5">
                      {time} <span className="text-surface-700">·</span> {meta.label} <span className="text-surface-700">·</span> {r.actor}
                    </div>
                    <Link to={r.href} className="text-sm text-surface-200 hover:text-violet-300 truncate block">
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
