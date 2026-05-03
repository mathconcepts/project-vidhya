/**
 * RulesetsPage — admin dashboard at /admin/rulesets
 *
 * Operator-defined plain-text constraints scoped by (exam_pack_id,
 * concept_pattern). The arbitrator reads applicable rulesets and
 * threads them as constraints into every blueprint it produces.
 */

import { useEffect, useState } from 'react';
import { Loader2, Lock, Plus, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listRulesets, createRuleset, setRulesetEnabled, deleteRuleset,
  type BlueprintRuleset,
} from '@/api/admin/rulesets';

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
    if (authLoading || !user || user.role !== 'admin') return;
    refresh();
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-violet-400 text-xs uppercase tracking-wider mb-2">
          <Sparkles size={14} /> Blueprint rulesets
        </div>
        <h1 className="text-2xl font-display font-semibold text-surface-100">
          Operator constraints, scoped per exam + concept pattern
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Each enabled ruleset attaches as a constraint to every blueprint produced by the arbitrator
          for the matching <code>exam_pack_id × concept_pattern</code>. Use SQL <code>LIKE</code>{' '}
          patterns: <code>%</code> for whole pack, <code>vectors-%</code> for a prefix.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      )}

      <button
        onClick={() => setCreating((c) => !c)}
        className="mb-4 px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium inline-flex items-center gap-1 hover:bg-violet-500/20"
      >
        <Plus size={12} /> {creating ? 'Cancel' : 'New ruleset'}
      </button>

      {creating && (
        <div className="mb-4 p-4 rounded-xl border border-surface-800 bg-surface-900 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-surface-400 space-y-1">
              <span>Exam pack</span>
              <input
                value={examPack}
                onChange={(e) => setExamPack(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded border border-surface-700 bg-surface-950 text-surface-200"
              />
            </label>
            <label className="text-xs text-surface-400 space-y-1">
              <span>Concept pattern (LIKE)</span>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="%"
                className="w-full px-2 py-1.5 text-xs rounded border border-surface-700 bg-surface-950 text-surface-200 font-mono"
              />
            </label>
          </div>
          <textarea
            placeholder='e.g. "Always include a 2D geometric visualisation atom before any algebraic manipulation."'
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full px-2 py-1.5 text-sm rounded border border-surface-700 bg-surface-950 text-surface-200"
          />
          <button
            onClick={handleCreate}
            disabled={busy || !text.trim()}
            className="px-3 py-1.5 rounded text-xs bg-violet-500 text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Create'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {rulesets === null && <div className="text-sm text-surface-500">Loading…</div>}
        {rulesets && rulesets.length === 0 && (
          <div className="text-sm text-surface-500 text-center py-12">
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
    <div className={`p-3 rounded-xl border bg-surface-900 ${ruleset.enabled ? 'border-violet-500/25' : 'border-surface-800 opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">
            {ruleset.exam_pack_id} <span className="text-surface-700">·</span> <code className="text-violet-400">{ruleset.concept_pattern}</code>
          </div>
          <div className="text-sm text-surface-200 whitespace-pre-wrap">{ruleset.rule_text}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            disabled={busy}
            className={`text-xs px-2 py-1 rounded border ${ruleset.enabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-surface-700 text-surface-400'}`}
          >
            {ruleset.enabled ? 'enabled' : 'disabled'}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="p-1.5 rounded text-surface-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
