/**
 * RulesetsPage — admin dashboard at /admin/rulesets
 *
 * Operator-defined plain-text constraints scoped by (exam_pack_id,
 * concept_pattern). The arbitrator reads applicable rulesets and
 * threads them as constraints into every blueprint it produces.
 */

import { useEffect, useState } from 'react';
import { Loader2, Lock, Plus, Trash2, Sparkles, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import {
  listRulesets, createRuleset, setRulesetEnabled, deleteRuleset,
  type BlueprintRuleset,
} from '@/api/admin/rulesets';
import { JourneyNudge } from '@/components/admin/JourneyNudge';
import { PresetsPanel } from '@/components/admin/PresetsPanel';

export default function RulesetsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rulesets, setRulesets] = useState<BlueprintRuleset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [examPack, setExamPack] = useState('jee-main');
  const [pattern, setPattern] = useState('%');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => listRulesets().then(setRulesets).catch((e) => setError((e as Error).message));

  useEffect(() => {
    if (authLoading || !user || !isAdminRole(user.role)) return;
    refresh();
  }, [authLoading, user]);

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

  const handleCreate = async () => {
    if (!text.trim()) return;
    setBusy(true); setError(null);
    try {
      await createRuleset({ exam_pack_id: examPack, concept_pattern: pattern, rule_text: text.trim() });
      setText(''); setCreating(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 896, margin: '0 auto', padding: '32px 16px' }}>
      <JourneyNudge currentHref="/admin/rulesets" />
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--indigo-ink)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          <Sparkles size={14} /> Blueprint rulesets
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Operator constraints, scoped per exam + concept pattern
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Each enabled ruleset attaches as a constraint to every blueprint produced by the arbitrator
          for the matching <code>exam_pack_id × concept_pattern</code>. Use SQL <code>LIKE</code>{' '}
          patterns: <code>%</code> for whole pack, <code>vectors-%</code> for a prefix.
        </p>
      </header>

      {error && /503|DATABASE_URL/i.test(error) ? (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,159,10,.22)', background: 'rgba(255,159,10,.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--orange)', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}>
            <Database size={14} /> Rulesets need a database
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This deploy is running without <code>DATABASE_URL</code>. Rulesets, blueprints, and the
            generation pipeline all persist to Postgres. Set the env var on Render and redeploy, or
            run <code>docker compose up</code> locally.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Until then, you can still browse the <code>/admin/scenarios</code> demo path which works
            without a DB.
          </p>
        </div>
      ) : error ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,.22)', background: 'rgba(255,59,48,.06)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>{error}</div>
      ) : null}

      <PresetsPanel onInstalled={() => refresh()} />

      <button
        onClick={() => setCreating((c) => !c)}
        style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(88,86,214,.3)', background: 'rgba(88,86,214,.08)', color: 'var(--indigo-ink)', fontSize: 11, fontWeight: 'var(--weight-medium)', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
      >
        <Plus size={12} /> {creating ? 'Cancel' : 'New ruleset'}
      </button>

      {creating && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Exam pack</span>
              <input
                value={examPack}
                onChange={(e) => setExamPack(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Concept pattern (LIKE)</span>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="%"
                style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
              />
            </label>
          </div>
          <textarea
            placeholder='e.g. "Always include a 2D geometric visualisation atom before any algebraic manipulation."'
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '6px 8px', fontSize: 'var(--text-caption)', borderRadius: 'var(--radius-sm)', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)', color: 'var(--text-primary)', boxSizing: 'border-box', resize: 'vertical' }}
          />
          <button
            onClick={handleCreate}
            disabled={busy || !text.trim()}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11, background: busy || !text.trim() ? 'var(--surface-fill)' : 'var(--indigo)', color: busy || !text.trim() ? 'var(--text-tertiary)' : '#fff', border: 'none', cursor: busy || !text.trim() ? 'not-allowed' : 'pointer', opacity: busy || !text.trim() ? 0.5 : 1 }}
          >
            {busy ? 'Saving…' : 'Create'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rulesets === null && <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Loading…</div>}
        {rulesets && rulesets.length === 0 && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0' }}>
            No rulesets yet. Create one above.
          </div>
        )}
        {rulesets?.map((rs) => (
          <RulesetRow key={rs.id} ruleset={rs} onChange={refresh} onError={(m) => setError(m)} />
        ))}
      </div>
    </div>
  );
}

function RulesetRow({
  ruleset,
  onChange,
  onError,
}: {
  ruleset: BlueprintRuleset;
  onChange: () => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try { await setRulesetEnabled(ruleset.id, !ruleset.enabled); onChange(); }
    catch (e) { onError((e as Error).message); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this ruleset?')) return;
    setBusy(true);
    try { await deleteRuleset(ruleset.id); onChange(); }
    catch (e) { onError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      padding: 12,
      borderRadius: 'var(--radius-md)',
      border: ruleset.enabled ? '1px solid rgba(88,86,214,.25)' : 'var(--hairline) solid var(--separator)',
      background: 'var(--surface-card)',
      opacity: ruleset.enabled ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {ruleset.exam_pack_id} <span style={{ color: 'var(--separator)' }}>·</span> <code style={{ color: 'var(--indigo-ink)', fontFamily: 'var(--font-mono)' }}>{ruleset.concept_pattern}</code>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{ruleset.rule_text}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggle}
            disabled={busy}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: ruleset.enabled ? '1px solid rgba(52,199,89,.25)' : 'var(--hairline) solid var(--separator)',
              background: ruleset.enabled ? 'rgba(52,199,89,.08)' : 'transparent',
              color: ruleset.enabled ? 'var(--green-ink)' : 'var(--text-tertiary)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {ruleset.enabled ? 'enabled' : 'disabled'}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            style={{ padding: 6, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
