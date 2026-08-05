/**
 * ScenariosPage — admin dashboard at /admin/scenarios + /admin/scenarios/:id
 *
 * Lists persona trial runs (newest first); when a run is selected, shows
 * the trial summary + per-atom breakdown + a "Show neutral version"
 * button that fetches the on-demand neutral render and renders side-by-
 * side with the personalized atom.
 *
 * The side-by-side view is the moat surface — it makes the difference
 * between "personalized" and "generic" visible, on screen, with the
 * scorers and prior_curriculum that calibrated the personalized side.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, Sparkles, ChevronRight, PlayCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listScenarios,
  readScenario,
  neutralRender,
  seedDemo,
  type TrialState,
  type RunListItem,
  type SeedDemoResult,
} from '@/api/admin/scenarios';

export default function ScenariosPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading } = useAuth();

  const [runs, setRuns] = useState<RunListItem[] | null>(null);
  const [trial, setTrial] = useState<TrialState | null>(null);
  const [digest, setDigest] = useState<string>('');
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedDemoResult | null>(null);
  const [seedErr, setSeedErr] = useState<string | null>(null);

  const loadRuns = useCallback(() => {
    if (!user || user.role !== 'admin') return;
    listScenarios()
      .then(setRuns)
      .catch((e) => setLoadErr((e as Error).message));
  }, [user]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    loadRuns();
  }, [authLoading, user, loadRuns]);

  const onSeedDemo = async () => {
    setSeedErr(null);
    setSeedResult(null);
    setSeeding(true);
    try {
      const result = await seedDemo();
      setSeedResult(result);
      loadRuns();
    } catch (e) {
      setSeedErr((e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setTrial(null);
      setDigest('');
      return;
    }
    readScenario(id)
      .then(({ trial, digest }) => {
        setTrial(trial);
        setDigest(digest);
      })
      .catch((e) => setLoadErr((e as Error).message));
  }, [id]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-tertiary)' }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: 448, margin: '80px auto', padding: 24, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', textAlign: 'center' }}>
        <Lock size={28} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
        <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Admin only</p>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Persona trial runs are operator-only debug data.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 16px' }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--indigo-ink)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          <Sparkles size={14} /> Persona Scenarios
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Demo: persona × concept × delta
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Each run drives a scripted persona through a concept. The side-by-side view
          shows what a generic prompt would have produced for the same atom.
        </p>
      </header>

      {loadErr && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {loadErr}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* Sidebar: run list */}
        <aside>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recent runs</div>
          {runs === null && <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Loading…</div>}
          {runs && runs.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              No runs yet.
            </div>
          )}
          {runs?.map((r) => (
            <Link
              key={r.id}
              to={`/admin/scenarios/${encodeURIComponent(r.id)}`}
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                background: id === r.id ? 'var(--surface-fill)' : 'transparent',
                color: id === r.id ? 'var(--indigo-ink)' : 'var(--text-secondary)',
                marginBottom: 2,
              }}
            >
              {r.id}
            </Link>
          ))}
        </aside>

        {/* Main: trial detail or demo seed CTA */}
        <section>
          {!trial && id === undefined && (
            runs !== null && runs.length === 0 ? (
              <DemoSeedCard
                seeding={seeding}
                seedResult={seedResult}
                seedErr={seedErr}
                onSeed={onSeedDemo}
              />
            ) : (
              <div style={{ fontSize: 15, color: 'var(--text-tertiary)' }}>Select a run to view its trial.</div>
            )
          )}
          {trial && <TrialDetail trial={trial} digest={digest} runId={id!} />}
        </section>
      </div>
    </div>
  );
}

function TrialDetail({ trial, digest, runId }: { trial: TrialState; digest: string; runId: string }) {
  const delta = trial.current_mastery - trial.initial_mastery;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Persona × Concept</div>
        <div style={{ fontSize: 18, fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trial.persona_id} <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} /> {trial.concept_id}
        </div>
        <div style={{ marginTop: 8, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Mastery: <span style={{ color: 'var(--text-primary)' }}>{trial.initial_mastery.toFixed(2)}</span> →{' '}
          <span style={{ color: 'var(--text-primary)' }}>{trial.current_mastery.toFixed(2)}</span>{' '}
          <span style={{ color: delta >= 0 ? 'var(--green-ink)' : 'var(--red)' }}>
            (Δ {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)})
          </span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
          Status: {trial.status}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trial.events.map((e) => (
          <EventRow key={e.idx} event={e} runId={runId} />
        ))}
        {trial.pending && (
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,159,10,.22)', background: 'rgba(255,159,10,.05)', fontSize: 'var(--text-caption)', color: 'var(--orange)' }}>
            Paused on <code>{trial.pending.atom.id}</code>: {trial.pending.reason}.
            Resume from CLI: <code>npm run demo:scenario:resume {trial.run_id}</code>
          </div>
        )}
      </div>

      <details style={{ borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
        <summary style={{ padding: '12px 16px', fontSize: 'var(--text-caption)', cursor: 'pointer', color: 'var(--text-secondary)' }}>Markdown digest</summary>
        <pre style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap', margin: 0 }}>{digest}</pre>
      </details>
    </motion.div>
  );
}

function EventRow({ event, runId }: { event: TrialState['events'][number]; runId: string }) {
  const [neutral, setNeutral] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onShowNeutral = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await neutralRender(runId, event.atom_id);
      setNeutral(r.body);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Status is a coloured dot, not an icon or emoji glyph (Clarity iconography rule).
  let dotColor = 'var(--text-tertiary)';
  let summary = '';
  if (event.result.kind === 'answer') {
    dotColor = event.result.correct ? 'var(--green)' : 'var(--red)';
    summary = `${event.result.via_rule} → ${event.result.correct ? 'correct' : 'incorrect'}`;
  } else if (event.result.kind === 'human_answered') {
    dotColor = event.result.correct ? 'var(--green)' : 'var(--red)';
    summary = `human: ${event.result.answer}`;
  } else {
    dotColor = 'var(--orange)';
    summary = event.result.reason;
  }

  return (
    <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 'var(--text-caption)' }}>
          <span style={{ color: 'var(--text-tertiary)', marginRight: 8 }}>#{event.idx}</span>
          <code style={{ color: 'var(--text-secondary)' }}>{event.atom_id}</code>
          <span
            aria-hidden="true"
            style={{ display: 'inline-block', marginLeft: 8, width: 9, height: 9, borderRadius: '50%', background: dotColor, verticalAlign: 'middle' }}
          />
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>{summary}</span>
        </div>
        <button
          onClick={onShowNeutral}
          style={{ fontSize: 11, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(88,86,214,.3)', color: 'var(--indigo-ink)', background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer' }}
          disabled={loading}
        >
          {loading ? 'Loading…' : neutral ? 'Refresh neutral' : 'Show neutral version'}
        </button>
      </div>
      {err && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)' }}>{err}</div>}
      {neutral && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(88,86,214,.25)', background: 'rgba(88,86,214,.04)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--indigo-ink)', marginBottom: 8 }}>
              Personalized (this run)
            </div>
            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              See atom {event.atom_id} as served to the persona during this run.
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              Neutral (generic prompt)
            </div>
            <div style={{ color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap' }}>{neutral}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoSeedCard({
  seeding,
  seedResult,
  seedErr,
  onSeed,
}: {
  seeding: boolean;
  seedResult: SeedDemoResult | null;
  seedErr: string | null;
  onSeed: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 24,
        borderRadius: 'var(--radius-md)',
        border: 'var(--hairline) solid var(--separator)',
        background: 'var(--surface-card)',
        maxWidth: 520,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <PlayCircle size={20} style={{ color: 'var(--green-ink)', flexShrink: 0 }} />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Seed the moat demo
        </h2>
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Runs both scripted personas — Priya (anxious, geometric) and Arjun (driven, algebraic) — against the{' '}
        <code style={{ fontSize: 13, color: 'var(--text-primary)' }}>derivatives-basic</code> concept and writes
        their trial files to disk.
      </p>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        No terminal needed. Two trial rows appear in the sidebar when seeding completes. Then click any row and
        use "Show neutral version" to see the side-by-side comparison.
      </p>

      {seedErr && (
        <div style={{ marginBottom: 16, padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 13, color: 'var(--red)' }}>
          {seedErr}
        </div>
      )}

      {seedResult && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(52,199,89,.22)', background: 'rgba(52,199,89,.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 'var(--weight-medium)', color: 'var(--green-ink)', marginBottom: 8 }}>
            Seeded {seedResult.personas.length} persona{seedResult.personas.length !== 1 ? 's' : ''} against {seedResult.concept_id}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {seedResult.personas.map((p) => (
              <div key={p.run_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span
                  style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: p.status === 'complete' ? 'var(--green)' : 'var(--orange)', flexShrink: 0 }}
                  aria-hidden="true"
                />
                <code style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.run_id}</code>
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>{p.status}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
            Select a run in the sidebar to view its trial.
          </p>
        </div>
      )}

      <button
        onClick={onSeed}
        disabled={seeding}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 20px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: seeding ? 'var(--surface-fill)' : 'var(--green)',
          color: seeding ? 'var(--text-tertiary)' : '#fff',
          fontSize: 15,
          fontWeight: 'var(--weight-medium)',
          cursor: seeding ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s var(--ease-standard)',
        }}
      >
        {seeding && <Loader2 size={15} className="animate-spin" />}
        {seeding ? 'Seeding…' : seedResult ? 'Re-seed' : 'Seed the moat demo'}
      </button>
    </motion.div>
  );
}
