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
      const canonicalIds = new Set(CANONICAL_PACKS.map((p) => p.id));
      setOperatorPacks(packs.filter((p) => !canonicalIds.has(p.id)));
    });
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: 448, margin: '80px auto', padding: 24, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', textAlign: 'center' }}>
        <Lock size={28} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Admin only</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 0' }}>
      <JourneyNudge currentHref="/admin/exam-packs" />

      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--indigo-ink)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          <BookOpen size={14} /> Exam packs
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Pick the exam your cohort is preparing for
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          An exam pack defines the syllabus, sections, weights, holdout PYQs, and capability flags
          (e.g. <code>interactives_enabled</code>). Canonical packs ship in the repo; operator-defined
          packs live in the DB.
        </p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-ink)' }}>Canonical · ships with Vidhya</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANONICAL_PACKS.map((p) => <PackRow key={p.id} pack={p} />)}
        </div>
      </section>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--indigo-ink)' }}>Operator-defined</h2>
        {operatorPacks === null ? (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Loading…</div>
        ) : operatorPacks.length === 0 ? (
          <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              No operator-defined packs yet.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
              Most admins start with a canonical pack above. Custom packs are configured via the
              API (<code>POST /api/admin/exam-packs</code>) — a UI for this lands later.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {operatorPacks.map((p) => <PackRow key={p.id} pack={p} />)}
          </div>
        )}
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ marginTop: 32, padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(88,86,214,.22)', background: 'rgba(88,86,214,.05)' }}
      >
        <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--indigo-ink)' }}>Picked an exam?</strong> Next move: install a starter pack
          that bundles cohort rulesets + concept blueprints in one click.
        </p>
        <Link
          to="/admin/rulesets"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--indigo-ink)', textDecoration: 'none' }}
        >
          Go to rulesets <ArrowRight size={11} />
        </Link>
      </motion.div>
    </div>
  );
}

function PackRow({ pack }: { pack: ExamPackRow }) {
  return (
    <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <CheckCircle2 size={18} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{pack.name}</span>
          <code style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{pack.id}</code>
          {pack.interactives_enabled && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(88,86,214,.22)', background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)' }}>
              <Settings size={9} /> interactives
            </span>
          )}
          {pack.source === 'yaml' && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>YAML</span>
          )}
          {pack.source === 'operator' && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>DB</span>
          )}
          {pack.status === 'archived' && (
            <span style={{ fontSize: 10, color: 'var(--orange)' }}>archived</span>
          )}
        </div>
      </div>
    </div>
  );
}
