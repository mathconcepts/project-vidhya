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
      <div className="flex items-center justify-center min-h-screen text-surface-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border border-surface-800 bg-surface-900 text-center">
        <Lock size={28} className="mx-auto text-surface-500 mb-3" />
        <p className="text-surface-200 font-medium mb-1">Admin only</p>
        <p className="text-sm text-surface-400">Persona trial runs are operator-only debug data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-400 text-xs uppercase tracking-wider mb-2">
          <Sparkles size={14} /> Persona Scenarios
        </div>
        <h1 className="text-2xl font-display font-semibold text-surface-100">
          Demo: persona × concept × delta
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Each run drives a scripted persona through a concept. The side-by-side view
          shows what a generic prompt would have produced for the same atom.
        </p>
      </header>

      {loadErr && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {loadErr}
        </div>
      )}

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar: run list */}
        <aside className="space-y-1">
          <div className="text-xs text-surface-500 uppercase tracking-wider mb-2">Recent runs</div>
          {runs === null && <div className="text-sm text-surface-500">Loading…</div>}
          {runs && runs.length === 0 && (
            <div className="text-sm text-surface-500">
              No runs yet. Run <code className="text-violet-400">npm run demo:scenario</code>.
            </div>
          )}
          {runs?.map((r) => (
            <Link
              key={r.id}
              to={`/admin/scenarios/${encodeURIComponent(r.id)}`}
              className={`block px-3 py-2 rounded text-xs font-mono truncate hover:bg-surface-800 ${
                id === r.id ? 'bg-surface-800 text-violet-300' : 'text-surface-300'
              }`}
            >
              {r.id}
            </Link>
          ))}
        </aside>

        {/* Main: trial detail */}
        <section>
          {!trial && id === undefined && (
            <div className="text-sm text-surface-500">Select a run to view its trial.</div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="p-4 rounded-xl border border-surface-800 bg-surface-900">
        <div className="text-xs text-surface-500 mb-1">Persona × Concept</div>
        <div className="text-lg font-medium text-surface-100">
          {trial.persona_id} <ChevronRight size={14} className="inline text-surface-600" /> {trial.concept_id}
        </div>
        <div className="mt-2 text-sm text-surface-400">
          Mastery: <span className="text-surface-200">{trial.initial_mastery.toFixed(2)}</span> →{' '}
          <span className="text-surface-200">{trial.current_mastery.toFixed(2)}</span>{' '}
          <span className={delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            (Δ {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)})
          </span>
        </div>
        <div className="mt-2 text-[11px] uppercase tracking-wide text-surface-500">
          Status: {trial.status}
        </div>
      </div>

      <div className="space-y-2">
        {trial.events.map((e) => (
          <EventRow key={e.idx} event={e} runId={runId} />
        ))}
        {trial.pending && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-200">
            Paused on <code>{trial.pending.atom.id}</code>: {trial.pending.reason}.
            Resume from CLI: <code>npm run demo:scenario:resume {trial.run_id}</code>
          </div>
        )}
      </div>

      <details className="rounded-xl border border-surface-800 bg-surface-900">
        <summary className="px-4 py-3 text-sm cursor-pointer text-surface-300">Markdown digest</summary>
        <pre className="px-4 py-3 text-xs text-surface-400 whitespace-pre-wrap">{digest}</pre>
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
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <span className="text-surface-500 mr-2">#{event.idx}</span>
          <code className="text-surface-200">{event.atom_id}</code>
          <span className="ml-2 text-surface-500">{mark}</span>
          <span className="ml-2 text-xs text-surface-400">{summary}</span>
        </div>
        <button
          onClick={onShowNeutral}
          className="text-xs px-2 py-1 rounded border border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
          disabled={loading}
        >
          {loading ? 'Loading…' : neutral ? 'Refresh neutral' : 'Show neutral version'}
        </button>
      </div>
      {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
      {neutral && (
        <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
          <div className="rounded border border-violet-500/25 p-3 bg-violet-500/5">
            <div className="text-[10px] uppercase tracking-wide text-violet-300 mb-2">
              Personalized (this run)
            </div>
            <div className="text-surface-300 whitespace-pre-wrap">
              See atom {event.atom_id} as served to the persona during this run.
            </div>
          </div>
          <div className="rounded border border-surface-700 p-3 bg-surface-950">
            <div className="text-[10px] uppercase tracking-wide text-surface-400 mb-2">
              Neutral (generic prompt)
            </div>
            <div className="text-surface-400 whitespace-pre-wrap">{neutral}</div>
          </div>
        </div>
      )}
    </div>
  );
}
