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
    <div style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid rgba(52,199,89,.25)', background: 'rgba(52,199,89,.06)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <Package size={16} style={{ color: 'var(--green-ink)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.075em', color: 'var(--green-ink)', marginBottom: '2px' }}>Starter packs</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            One-click install of curated rulesets + blueprints for known cohorts
          </div>
        </div>
        <ChevronDown
          size={14}
          style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {open && (
        <div style={{ borderTop: '1px solid rgba(52,199,89,.15)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {error && (
            <div style={{ fontSize: '12px', color: 'var(--red)', padding: '8px', borderRadius: '6px', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)' }}>{error}</div>
          )}
          {presets === null && !error && (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={11} className="animate-spin" /> Loading presets…
            </div>
          )}
          {presets?.map((p) => {
            const installed = doneIds.has(p.id);
            return (
              <div key={p.id} style={{ padding: '12px', borderRadius: '8px', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={11} style={{ color: 'var(--indigo-ink)' }} />
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.description}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{p.cohort_hint}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                      {p.ruleset_count} ruleset{p.ruleset_count === 1 ? '' : 's'} ·{' '}
                      {p.blueprint_count} blueprint{p.blueprint_count === 1 ? '' : 's'} ·{' '}
                      exam: {p.exam_pack_id}
                    </div>
                  </div>
                  <button
                    onClick={() => handleInstall(p.id)}
                    disabled={busyId === p.id || installed}
                    style={installed ? {
                      fontSize: '12px', padding: '6px 12px', borderRadius: '6px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'default',
                      background: 'rgba(52,199,89,.08)', color: 'var(--green-ink)', border: '1px solid rgba(52,199,89,.22)',
                    } : {
                      fontSize: '12px', padding: '6px 12px', borderRadius: '6px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                      cursor: busyId === p.id ? 'not-allowed' : 'pointer',
                      background: 'var(--green)', color: '#fff', border: 'none',
                      opacity: busyId === p.id ? 0.5 : 1,
                    }}
                  >
                    {busyId === p.id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Loader2 size={11} className="animate-spin" /> Installing</span>
                    ) : installed ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={11} /> Installed</span>
                    ) : (
                      'Install'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', paddingTop: '4px' }}>
            Install is idempotent — re-running skips rulesets/blueprints that already exist for the same exam pack + concept.
          </p>
        </div>
      )}
    </div>
  );
}
