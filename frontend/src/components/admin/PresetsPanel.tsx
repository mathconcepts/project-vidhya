/**
 * PresetsPanel — collapsible "Try a starter pack" panel.
 *
 * Surfaces the bundled presets (defined in src/blueprints/presets.ts)
 * with a one-click install button. Renders compactly when collapsed
 * so it doesn't crowd existing pages.
 *
 * Used on /admin/rulesets and /admin/blueprints.
 */

import { useEffect, useState } from 'react';
import { Sparkles, Package, ChevronDown, Check, Loader2 } from 'lucide-react';
import { listPresets, installPreset, type PresetSummary, type InstallResult } from '@/api/admin/presets';

interface Props {
  onInstalled?: (result: InstallResult) => void;
}

export function PresetsPanel({ onInstalled }: Props) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<PresetSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || presets !== null) return;
    listPresets().then(setPresets).catch((e) => setError((e as Error).message));
  }, [open, presets]);

  const handleInstall = async (id: string) => {
    setBusyId(id); setError(null);
    try {
      const r = await installPreset(id);
      setDoneIds((prev) => new Set(prev).add(id));
      onInstalled?.(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-emerald-500/10 transition-colors"
      >
        <Package size={16} className="text-emerald-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-emerald-300 mb-0.5">Starter packs</div>
          <div className="text-sm text-surface-200">
            One-click install of curated rulesets + blueprints for known cohorts
          </div>
        </div>
        <ChevronDown size={14} className={`text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-emerald-500/15 px-4 py-3 space-y-2">
          {error && (
            <div className="text-xs text-rose-300 p-2 rounded bg-rose-500/10 border border-rose-500/20">{error}</div>
          )}
          {presets === null && !error && (
            <div className="text-xs text-surface-500 flex items-center gap-2">
              <Loader2 size={11} className="animate-spin" /> Loading presets…
            </div>
          )}
          {presets?.map((p) => {
            const installed = doneIds.has(p.id);
            return (
              <div key={p.id} className="p-3 rounded-lg border border-surface-800 bg-surface-900">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-surface-100 flex items-center gap-2">
                      <Sparkles size={11} className="text-violet-300" />
                      {p.name}
                    </div>
                    <div className="text-[11px] text-surface-400 mt-1">{p.description}</div>
                    <div className="text-[10px] text-surface-500 mt-1">{p.cohort_hint}</div>
                    <div className="text-[10px] text-surface-500 mt-1.5 font-mono">
                      {p.ruleset_count} ruleset{p.ruleset_count === 1 ? '' : 's'} ·{' '}
                      {p.blueprint_count} blueprint{p.blueprint_count === 1 ? '' : 's'} ·{' '}
                      exam: {p.exam_pack_id}
                    </div>
                  </div>
                  <button
                    onClick={() => handleInstall(p.id)}
                    disabled={busyId === p.id || installed}
                    className={`text-xs px-3 py-1.5 rounded font-medium whitespace-nowrap shrink-0 ${
                      installed
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50'
                    }`}
                  >
                    {busyId === p.id ? (
                      <span className="inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Installing</span>
                    ) : installed ? (
                      <span className="inline-flex items-center gap-1"><Check size={11} /> Installed</span>
                    ) : (
                      'Install'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-surface-500 pt-1">
            Install is idempotent — re-running skips rulesets/blueprints that already exist for the same exam pack + concept.
          </p>
        </div>
      )}
    </div>
  );
}
