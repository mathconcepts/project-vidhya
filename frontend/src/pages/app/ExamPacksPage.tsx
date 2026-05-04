/**
 * ExamPacksPage — admin landing at /admin/exam-packs.
 *
 * The first milestone in the admin journey. Lists the canonical YAML
 * packs that ship in the repo + any operator-defined packs from the DB.
 * Read-only for v1; pack creation lives via the API + future PR.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, BookOpen, CheckCircle2, ArrowRight, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listExamPacks,
  CANONICAL_PACKS,
  type ExamPackRow,
} from '@/api/admin/exam-packs';
import { JourneyNudge } from '@/components/admin/JourneyNudge';

export default function ExamPacksPage() {
  const { user, loading: authLoading } = useAuth();
  const [operatorPacks, setOperatorPacks] = useState<ExamPackRow[] | null>(null);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    listExamPacks().then((packs) => {
      // Filter out anything that duplicates a canonical id (the canonical
      // packs are the source of truth for the bundled exams).
      const canonicalIds = new Set(CANONICAL_PACKS.map((p) => p.id));
      setOperatorPacks(packs.filter((p) => !canonicalIds.has(p.id)));
    });
  }, [authLoading, user]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <JourneyNudge currentHref="/admin/exam-packs" />

      <header className="mb-6">
        <div className="flex items-center gap-2 text-violet-400 text-xs uppercase tracking-wider mb-2">
          <BookOpen size={14} /> Exam packs
        </div>
        <h1 className="text-2xl font-display font-semibold text-surface-100">
          Pick the exam your cohort is preparing for
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          An exam pack defines the syllabus, sections, weights, holdout PYQs, and capability flags
          (e.g. <code>interactives_enabled</code>). Canonical packs ship in the repo; operator-defined
          packs live in the DB.
        </p>
      </header>

      {/* Canonical (YAML-bundled) packs — always present */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-emerald-300 mb-3">Canonical · ships with Vidhya</h2>
        <div className="space-y-2">
          {CANONICAL_PACKS.map((p) => <PackRow key={p.id} pack={p} />)}
        </div>
      </section>

      {/* Operator-defined packs (DB) */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-violet-300 mb-3">Operator-defined</h2>
        {operatorPacks === null ? (
          <div className="text-sm text-surface-500">Loading…</div>
        ) : operatorPacks.length === 0 ? (
          <div className="p-4 rounded-xl border border-surface-800 bg-surface-900">
            <p className="text-sm text-surface-300">
              No operator-defined packs yet.
            </p>
            <p className="text-xs text-surface-500 mt-2">
              Most admins start with a canonical pack above. Custom packs are configured via the
              API (<code>POST /api/admin/exam-packs</code>) — a UI for this lands later.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {operatorPacks.map((p) => <PackRow key={p.id} pack={p} />)}
          </div>
        )}
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5"
      >
        <p className="text-sm text-surface-200 mb-2">
          <strong className="text-violet-300">Picked an exam?</strong> Next move: install a starter pack
          that bundles cohort rulesets + concept blueprints in one click.
        </p>
        <Link
          to="/admin/rulesets"
          className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
        >
          Go to rulesets <ArrowRight size={11} />
        </Link>
      </motion.div>
    </div>
  );
}

function PackRow({ pack }: { pack: ExamPackRow }) {
  return (
    <div className="p-3 rounded-xl border border-surface-800 bg-surface-900 flex items-start gap-3">
      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-surface-100">{pack.name}</span>
          <code className="text-[11px] text-surface-500">{pack.id}</code>
          {pack.interactives_enabled && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <Settings size={9} /> interactives
            </span>
          )}
          {pack.source === 'yaml' && (
            <span className="text-[10px] text-surface-500">YAML</span>
          )}
          {pack.source === 'operator' && (
            <span className="text-[10px] text-surface-500">DB</span>
          )}
          {pack.status === 'archived' && (
            <span className="text-[10px] text-amber-400">archived</span>
          )}
        </div>
      </div>
    </div>
  );
}
