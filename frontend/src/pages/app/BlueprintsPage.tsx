/**
 * BlueprintsPage — admin dashboard at /admin/blueprints[/:id]
 *
 * The "intermediate layout layer" between RunLauncher and the
 * curriculum-unit-orchestrator: a human-editable spec that calls out
 * EXPLICITLY what stages, atom_kinds, and constraints the generator
 * will use, plus the rationale behind each choice.
 *
 * Autonomous by default — operator can edit + approve, or let the
 * template-generated default fire as-is.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, BookOpen, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listBlueprints,
  getBlueprint,
  createBlueprintFromTemplate,
  patchBlueprint,
  approveBlueprint,
  type ContentBlueprint,
  type DifficultyLabel,
} from '@/api/admin/blueprints';

export default function BlueprintsPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading } = useAuth();

  const [blueprints, setBlueprints] = useState<ContentBlueprint[] | null>(null);
  const [active, setActive] = useState<ContentBlueprint | null>(null);
  const [etag, setEtag] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    listBlueprints({}).then(setBlueprints).catch((e) => setError((e as Error).message));
  }, [authLoading, user]);

  useEffect(() => {
    if (!id) { setActive(null); return; }
    getBlueprint(id)
      .then(({ blueprint, etag }) => { setActive(blueprint); setEtag(etag); })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-violet-400" /></div>;
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border border-surface-800 bg-surface-900 text-center">
        <Lock size={28} className="mx-auto text-surface-500 mb-3" />
        <p className="text-surface-200 font-medium mb-1">Admin only</p>
        <p className="text-sm text-surface-400">Blueprints are operator-only generation specs.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-400 text-xs uppercase tracking-wider mb-2">
          <BookOpen size={14} /> Content Blueprints
        </div>
        <h1 className="text-2xl font-display font-semibold text-surface-100">
          The spec layer: stages, atom kinds, rationale
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Each blueprint is the human-editable plan a generation run is built from.
          Edit per-stage decisions before generation fires, or approve the
          template's default and let it ship.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <Sidebar blueprints={blueprints} activeId={id ?? null} onCreated={(bp) => {
          setBlueprints((cur) => (cur ? [bp, ...cur] : [bp]));
        }} />
        {active ? (
          <Detail
            blueprint={active}
            etag={etag}
            onUpdated={(bp, newEtag) => { setActive(bp); setEtag(newEtag); }}
          />
        ) : (
          <div className="text-sm text-surface-500">
            {id ? 'Loading…' : 'Select a blueprint or create one to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  blueprints,
  activeId,
  onCreated,
}: {
  blueprints: ContentBlueprint[] | null;
  activeId: string | null;
  onCreated: (bp: ContentBlueprint) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [conceptId, setConceptId] = useState('');
  const [examPack, setExamPack] = useState('jee-main');
  const [difficulty, setDifficulty] = useState<DifficultyLabel>('medium');
  const [useArbitrator, setUseArbitrator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!conceptId) return;
    setBusy(true); setErr(null);
    try {
      const bp = await createBlueprintFromTemplate({
        concept_id: conceptId,
        exam_pack_id: examPack,
        target_difficulty: difficulty,
        use_arbitrator: useArbitrator,
      });
      onCreated(bp);
      setCreating(false);
      setConceptId('');
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <aside className="space-y-2">
      <button
        onClick={() => setCreating((c) => !c)}
        className="w-full px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium flex items-center justify-center gap-1 hover:bg-violet-500/20"
      >
        <Plus size={12} /> {creating ? 'Cancel' : 'New blueprint'}
      </button>

      {creating && (
        <div className="p-3 rounded-lg border border-surface-800 bg-surface-900 space-y-2">
          <input
            type="text"
            placeholder="concept_id (e.g. limits-jee)"
            value={conceptId}
            onChange={(e) => setConceptId(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border border-surface-700 bg-surface-950 text-surface-200"
          />
          <input
            type="text"
            value={examPack}
            onChange={(e) => setExamPack(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border border-surface-700 bg-surface-950 text-surface-200"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLabel)}
            className="w-full px-2 py-1.5 text-xs rounded border border-surface-700 bg-surface-950 text-surface-200"
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
          <label className="flex items-center gap-2 text-[11px] text-surface-400">
            <input
              type="checkbox"
              checked={useArbitrator}
              onChange={(e) => setUseArbitrator(e.target.checked)}
              className="rounded border-surface-700"
            />
            <span>Run arbitrator (LLM may override template)</span>
          </label>
          {err && <div className="text-[11px] text-rose-400">{err}</div>}
          <button
            onClick={handleCreate}
            disabled={busy || !conceptId}
            className="w-full px-3 py-1.5 rounded text-xs bg-violet-500 text-white disabled:opacity-50"
          >
            {busy ? 'Building…' : 'Build from template'}
          </button>
        </div>
      )}

      <div className="text-[10px] text-surface-500 uppercase tracking-wider mt-4 mb-1">Recent</div>
      {blueprints === null && <div className="text-xs text-surface-500">Loading…</div>}
      {blueprints && blueprints.length === 0 && (
        <div className="text-xs text-surface-500">No blueprints yet.</div>
      )}
      {blueprints?.map((b) => (
        <Link
          key={b.id}
          to={`/admin/blueprints/${encodeURIComponent(b.id)}`}
          className={`block px-3 py-2 rounded text-xs hover:bg-surface-800 ${activeId === b.id ? 'bg-surface-800 text-violet-300' : 'text-surface-300'}`}
        >
          <div className="truncate">{b.concept_id}</div>
          <div className="text-[10px] text-surface-500 mt-0.5">
            {b.created_by} · {b.decisions.metadata.target_difficulty}
            {b.approved_at && ' · approved'}
          </div>
        </Link>
      ))}
    </aside>
  );
}

function Detail({
  blueprint,
  etag,
  onUpdated,
}: {
  blueprint: ContentBlueprint;
  etag: string;
  onUpdated: (bp: ContentBlueprint, etag: string) => void;
}) {
  const [editing, setEditing] = useState<string>('');
  const [draft, setDraft] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const beginEdit = () => {
    setEditing(blueprint.id);
    setDraft(JSON.stringify(blueprint.decisions, null, 2));
    setErr(null);
  };

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const decisions = JSON.parse(draft);
      const r = await patchBlueprint(blueprint.id, etag, { decisions });
      if (r.kind === 'conflict') {
        setErr('This blueprint was edited elsewhere. Reload to see the current version.');
        onUpdated(r.current, `"${r.current.updated_at}"`);
        return;
      }
      onUpdated(r.blueprint, `"${r.blueprint.updated_at}"`);
      setEditing('');
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  const approve = async () => {
    setBusy(true); setErr(null);
    try {
      const bp = await approveBlueprint(blueprint.id, etag);
      onUpdated(bp, `"${bp.updated_at}"`);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="p-4 rounded-xl border border-surface-800 bg-surface-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-surface-500">Concept × Exam Pack</div>
            <div className="text-lg font-medium text-surface-100">
              {blueprint.concept_id} <span className="text-surface-600">·</span> {blueprint.exam_pack_id}
            </div>
            <div className="text-xs text-surface-400 mt-1">
              Target: {blueprint.decisions.metadata.target_difficulty}
              {' · created by '}<span className="text-surface-300">{blueprint.created_by}</span>
              {' · confidence '}<span className="text-surface-300">{blueprint.confidence.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {blueprint.approved_at ? (
              <span className="inline-flex items-center gap-1 text-emerald-300 text-xs">
                <CheckCircle2 size={12} /> Approved
              </span>
            ) : blueprint.requires_review ? (
              <span className="inline-flex items-center gap-1 text-amber-300 text-xs">
                <AlertCircle size={12} /> Needs review
              </span>
            ) : null}
            {!blueprint.approved_at && (
              <button
                onClick={approve}
                disabled={busy}
                className="text-xs px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 disabled:opacity-50"
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-surface-800 bg-surface-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-surface-200">Stages</h3>
          {!editing && (
            <button onClick={beginEdit} className="text-xs text-violet-300 hover:underline">
              Edit JSON
            </button>
          )}
        </div>
        {!editing ? (
          <div className="space-y-2">
            {blueprint.decisions.stages.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-surface-800 bg-surface-950">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-violet-300">{s.id}</span>
                  <span className="text-xs text-surface-200">→ {s.atom_kind}</span>
                  {s.count !== undefined && <span className="text-[11px] text-surface-500">×{s.count}</span>}
                </div>
                <div className="text-[11px] text-surface-400 mt-1">
                  Why: <code className="text-surface-300">{s.rationale_id}</code>
                  {s.rationale_note && <span className="text-surface-500"> — {s.rationale_note}</span>}
                </div>
                {s.difficulty_mix && (
                  <div className="text-[11px] text-surface-500 mt-1">
                    Mix: easy {s.difficulty_mix.easy}% · med {s.difficulty_mix.medium}% · hard {s.difficulty_mix.hard}%
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={20}
              className="w-full font-mono text-[11px] p-3 rounded bg-surface-950 border border-surface-700 text-surface-200"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditing('')} className="text-xs text-surface-400 hover:text-surface-200">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="text-xs px-3 py-1 rounded bg-violet-500 text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
        {err && <div className="mt-2 text-xs text-rose-400">{err}</div>}
      </div>

      <div className="p-4 rounded-xl border border-surface-800 bg-surface-900">
        <h3 className="text-sm font-medium text-surface-200 mb-3">Constraints</h3>
        <ul className="space-y-1 text-xs text-surface-300">
          {blueprint.decisions.constraints.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-violet-400" />
              <code>{c.id}</code>
              <span className="text-surface-500">({c.source})</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
