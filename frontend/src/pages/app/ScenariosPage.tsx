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

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listScenarios,
  readScenario,
  neutralRender,
  type TrialState,
  type RunListItem,
} from '@/api/admin/scenarios';

export default function ScenariosPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading } = useAuth();

  const [runs, setRuns] = useState<RunListItem[] | null>(null);
  const [trial, setTrial] = useState<TrialState | null>(null);
  const [digest, setDigest] = useState<string>('');
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    listScenarios()
      .then(setRuns)
      .catch((e) => setLoadErr((e as Error).message));
  }, [authLoading, user]);

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
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              No runs yet. Run <code style={{ color: 'var(--indigo-ink)' }}>npm run demo:scenario</code>.
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

        {/* Main: trial detail */}
        <section>
          {!trial && id === undefined && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Select a run to view its trial.</div>
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
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,149,0,.22)', background: 'rgba(255,149,0,.05)', fontSize: 'var(--text-caption)', color: 'var(--orange)' }}>
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

  let mark = '·';
  let summary = '';
  if (event.result.kind === 'answer') {
    mark = event.result.correct ? '✓' : '✗';
    summary = `${event.result.via_rule} → ${event.result.correct ? 'correct' : 'incorrect'}`;
  } else if (event.result.kind === 'human_answered') {
    mark = event.result.correct ? '✓ (human)' : '✗ (human)';
    summary = `human: ${event.result.answer}`;
  } else {
    mark = '⏸';
    summary = event.result.reason;
  }

  return (
    <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 'var(--text-caption)' }}>
          <span style={{ color: 'var(--text-tertiary)', marginRight: 8 }}>#{event.idx}</span>
          <code style={{ color: 'var(--text-secondary)' }}>{event.atom_id}</code>
          <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>{mark}</span>
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
