/**
 * Manipulable.tsx
 *
 * Slider-driven derived value. Operator drags sliders; outputs evaluate
 * live via the safe formula evaluator. No D3 dependency — plain HTML
 * range inputs + state.
 *
 * Used for "drag-to-explore" intuitions where the relationship between
 * an input and an output is the lesson (e.g. "watch eigenvalue as the
 * matrix's diagonal varies").
 */

import { useState, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import { evalFormula, type ManipulableSpec } from './types';

interface Props {
  spec: ManipulableSpec;
}

export function Manipulable({ spec }: Props) {
  const initialVars = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const inp of spec.inputs) {
      out[inp.id] = inp.initial ?? inp.min;
    }
    return out;
  }, [spec.inputs]);

  const [vars, setVars] = useState<Record<string, number>>(initialVars);

  const evaluatedOutputs = useMemo(() => {
    return spec.outputs.map((o) => {
      try {
        const v = evalFormula(o.formula, vars);
        const digits = o.digits ?? 3;
        return { label: o.label, value: Number.isFinite(v) ? v.toFixed(digits) : '—', error: null as string | null };
      } catch (e) {
        return { label: o.label, value: '—', error: (e as Error).message };
      }
    });
  }, [spec.outputs, vars]);

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-fill)' }}
    >
      <header className="flex items-center gap-2">
        <Sliders size={14} style={{ color: 'var(--text-secondary)' }} aria-hidden />
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.title}</h4>
      </header>

      <div className="space-y-3">
        {spec.inputs.map((inp) => (
          <div key={inp.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor={`manip-${inp.id}`}
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {inp.label}
              </label>
              <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {vars[inp.id]?.toFixed(2)}
              </span>
            </div>
            <input
              id={`manip-${inp.id}`}
              type="range"
              min={inp.min}
              max={inp.max}
              step={inp.step ?? 0.1}
              value={vars[inp.id]}
              onChange={(e) =>
                setVars({ ...vars, [inp.id]: parseFloat(e.target.value) })
              }
              className="w-full"
              style={{ accentColor: 'var(--grey-6)' }}
              aria-valuemin={inp.min}
              aria-valuemax={inp.max}
              aria-valuenow={vars[inp.id]}
            />
            <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              <span>{inp.min}</span>
              <span>{inp.max}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-lg border p-3 space-y-1"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)' }}
      >
        {evaluatedOutputs.map((o, i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-2 text-xs"
            title={o.error ?? undefined}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{o.label}</span>
            <span
              className="font-mono tabular-nums"
              style={{ color: o.error ? 'var(--red)' : 'var(--text-primary)' }}
            >
              {o.value}
            </span>
          </div>
        ))}
      </div>

      {spec.caption && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{spec.caption}</p>
      )}
    </div>
  );
}
