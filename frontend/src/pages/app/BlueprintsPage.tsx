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
import { Loader2, Lock, BookOpen, CheckCircle2, AlertCircle, Plus, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import {
  listBlueprints,
  getBlueprint,
  createBlueprintFromTemplate,
  patchBlueprint,
  approveBlueprint,
  type ContentBlueprint,
  type DifficultyLabel,
} from '@/api/admin/blueprints';
import { JourneyNudge } from '@/components/admin/JourneyNudge';
import { PresetsPanel } from '@/components/admin/PresetsPanel';

export default function BlueprintsPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading } = useAuth();

  const [blueprints, setBlueprints] = useState<ContentBlueprint[] | null>(null);
  const [active, setActive] = useState<ContentBlueprint | null>(null);
  const [etag, setEtag] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !isAdminRole(user.role)) return;
    listBlueprints({}).then(setBlueprints).catch((e) => setError((e as Error).message));
  }, [authLoading, user]);

  useEffect(() => {
    if (!id) { setActive(null); return; }
    getBlueprint(id)
      .then(({ blueprint, etag }) => { setActive(blueprint); setEtag(etag); })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />
      </div>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ maxWidth: 448, margin: '80px auto 0', padding: 24, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', textAlign: 'center' }}>
        <Lock size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
        <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Admin only</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>Blueprints are operator-only generation specs.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 16px' }}>
      <JourneyNudge currentHref="/admin/blueprints" />
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--indigo-ink)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          <BookOpen size={13} /> Content Blueprints
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>
          The spec layer: stages, atom kinds, rationale
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Each blueprint is the human-editable plan a generation run is built from.
          Edit per-stage decisions before generation fires, or approve the
          template's default and let it ship.
        </p>
      </header>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <PresetsPanel onInstalled={() => {
        listBlueprints({}).then(setBlueprints).catch(() => { /* ignore */ });
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
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
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: 11,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface-fill)',
    border: 'var(--hairline) solid var(--separator)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={() => setCreating((c) => !c)}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(88,86,214,.3)', background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)', fontSize: 11, fontWeight: 'var(--weight-medium)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
      >
        <Plus size={12} /> {creating ? 'Cancel' : 'New blueprint'}
      </button>

      {creating && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="concept_id (e.g. limits-jee)"
            value={conceptId}
            onChange={(e) => setConceptId(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            value={examPack}
            onChange={(e) => setExamPack(e.target.value)}
            style={inputStyle}
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLabel)}
            style={inputStyle}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useArbitrator}
              onChange={(e) => setUseArbitrator(e.target.checked)}
            />
            <span>Run arbitrator (LLM may override template)</span>
          </label>
          {err && <div style={{ fontSize: 11, color: 'var(--red)' }}>{err}</div>}
          <button
            onClick={handleCreate}
            disabled={busy || !conceptId}
            style={{ width: '100%', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 11, background: (busy || !conceptId) ? 'var(--surface-fill)' : 'var(--indigo)', color: (busy || !conceptId) ? 'var(--text-tertiary)' : '#fff', cursor: (busy || !conceptId) ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Building…' : 'Build from template'}
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 16, marginBottom: 4 }}>Recent</div>
      {blueprints === null && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Loading…</div>}
      {blueprints && blueprints.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>No blueprints yet.</div>
      )}
      {blueprints?.map((b) => (
        <Link
          key={b.id}
          to={`/admin/blueprints/${encodeURIComponent(b.id)}`}
          style={{
            display: 'block',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            background: activeId === b.id ? 'var(--surface-fill)' : 'transparent',
            color: activeId === b.id ? 'var(--indigo-ink)' : 'var(--text-secondary)',
            fontSize: 11,
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.concept_id}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
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

  const cardStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 'var(--radius-md)',
    border: 'var(--hairline) solid var(--separator)',
    background: 'var(--surface-card)',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Meta card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Concept × Exam Pack</div>
            <div style={{ fontSize: 17, fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
              {blueprint.concept_id} <span style={{ color: 'var(--text-tertiary)' }}>·</span> {blueprint.exam_pack_id}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Target: {blueprint.decisions.metadata.target_difficulty}
              {' · created by '}<span style={{ color: 'var(--text-primary)' }}>{blueprint.created_by}</span>
              {' · confidence '}<span style={{ color: 'var(--text-primary)' }}>{blueprint.confidence.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {blueprint.approved_at ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green-ink)', fontSize: 11 }}>
                  <CheckCircle2 size={12} /> Approved
                </span>
                <Link
                  to={`/admin/content-rd?blueprint=${encodeURIComponent(blueprint.id)}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--indigo)', color: 'var(--text-on-accent)', fontSize: 11, fontWeight: 'var(--weight-medium)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  <Rocket size={11} /> Launch this blueprint
                </Link>
              </>
            ) : blueprint.requires_review ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--orange)', fontSize: 11 }}>
                <AlertCircle size={12} /> Needs review
              </span>
            ) : null}
            {!blueprint.approved_at && (
              <button
                onClick={approve}
                disabled={busy}
                style={{ fontSize: 11, padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(52,199,89,.3)', background: 'rgba(52,199,89,.08)', color: 'var(--green-ink)', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1 }}
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stages card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Stages</h3>
          {!editing && (
            <button
              onClick={beginEdit}
              style={{ fontSize: 11, color: 'var(--indigo-ink)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Edit JSON
            </button>
          )}
        </div>
        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blueprint.decisions.stages.map((s, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--indigo-ink)' }}>{s.id}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>→ {s.atom_kind}</span>
                  {s.count !== undefined && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>×{s.count}</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Why: <code style={{ color: 'var(--text-secondary)' }}>{s.rationale_id}</code>
                  {s.rationale_note && <span style={{ color: 'var(--text-tertiary)' }}> — {s.rationale_note}</span>}
                </div>
                {s.difficulty_mix && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
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
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setEditing('')}
                style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                style={{ fontSize: 11, padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: busy ? 'var(--surface-fill)' : 'var(--indigo)', color: busy ? 'var(--text-tertiary)' : '#fff', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
        {err && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)' }}>{err}</div>}
      </div>

      {/* Constraints card */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>Constraints</h3>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {blueprint.decisions.constraints.map((c, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0 }} />
              <code>{c.id}</code>
              <span style={{ color: 'var(--text-tertiary)' }}>({c.source})</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
