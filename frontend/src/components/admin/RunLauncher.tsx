/**
 * RunLauncher — operator-facing form to launch a GenerationRun.
 *
 * Layout (mobile-first single column, widens on lg):
 *
 *   ┌───────────────────────────────────────────────────────┐
 *   │ Hypothesis                                            │
 *   │ Exam pack │ Topic                                     │
 *   │ Pipeline (LLM, PYQ ground)  │ Verification tier       │
 *   │ Quota: count │ max $                                  │
 *   ├───────────────────────────────────────────────────────┤
 *   │ Estimate: $X · Y min · Z calls                        │
 *   │ Warnings (yellow)                                     │
 *   │                          [Dry-run]  [Launch]          │
 *   └───────────────────────────────────────────────────────┘
 *
 * The dry-run estimate updates with a 400ms debounce as the operator
 * adjusts fields, so cost feedback is live without spamming the API.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Loader2, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import {
  dryRun,
  createRun,
  type CostEstimate,
  type GenerationRunConfig,
} from '@/api/admin/content-rd';
import { fadeInUp } from '@/lib/animations';

interface Props {
  defaultExam?: string;
  onLaunched?: (runId: string) => void;
}

interface FormState {
  hypothesis: string;
  exam_pack_id: string;
  topic_id: string;
  llm_model: string;
  pyq_grounding: boolean;
  multi_llm_consensus: boolean;
  tier_ceiling: 'rag' | 'gemini' | 'wolfram';
  gemini_dual_solve: boolean;
  reviewer_strictness: 'lenient' | 'standard' | 'strict';
  count: number;
  max_cost_usd: number;
  difficulty_easy: number;
  difficulty_medium: number;
  difficulty_hard: number;
}

const DEFAULT_FORM: FormState = {
  hypothesis: '',
  exam_pack_id: 'gate-ma',
  topic_id: '',
  llm_model: 'gemini-2.5-flash',
  pyq_grounding: true,
  multi_llm_consensus: false,
  tier_ceiling: 'wolfram',
  gemini_dual_solve: true,
  reviewer_strictness: 'standard',
  count: 50,
  max_cost_usd: 5,
  difficulty_easy: 30,
  difficulty_medium: 50,
  difficulty_hard: 20,
};

function buildConfig(form: FormState): GenerationRunConfig {
  return {
    target: {
      topic_id: form.topic_id || undefined,
      difficulty_dist: {
        easy: form.difficulty_easy,
        medium: form.difficulty_medium,
        hard: form.difficulty_hard,
      },
    },
    pipeline: {
      llm_models: [form.llm_model],
      pyq_grounding: form.pyq_grounding,
      multi_llm_consensus: form.multi_llm_consensus,
    },
    verification: {
      tier_ceiling: form.tier_ceiling,
      gemini_dual_solve: form.gemini_dual_solve,
    },
    pedagogy: {
      reviewer_strictness: form.reviewer_strictness,
    },
    quota: {
      count: form.count,
      max_cost_usd: form.max_cost_usd,
    },
  };
}

export function RunLauncher({ defaultExam, onLaunched }: Props) {
  const [form, setForm] = useState<FormState>({
    ...DEFAULT_FORM,
    exam_pack_id: defaultExam ?? DEFAULT_FORM.exam_pack_id,
  });
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const config = useMemo(() => buildConfig(form), [form]);

  // Debounced live dry-run as form changes
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      runEstimate();
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  async function runEstimate() {
    setEstimating(true);
    setError(null);
    try {
      const r = await dryRun({ config });
      setEstimate(r.estimate);
    } catch (e) {
      setEstimate(null);
      setError((e as Error).message);
    } finally {
      setEstimating(false);
    }
  }

  async function handleLaunch() {
    setLaunching(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await createRun({
        exam_pack_id: form.exam_pack_id,
        config,
        hypothesis: form.hypothesis || undefined,
      });
      setSuccess(`Launched ${r.run.id} (queued)`);
      onLaunched?.(r.run.id);
      // Reset hypothesis so operator doesn't accidentally re-launch the same one
      setForm((f) => ({ ...f, hypothesis: '' }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLaunching(false);
    }
  }

  const diffSum = form.difficulty_easy + form.difficulty_medium + form.difficulty_hard;

  return (
    <motion.section variants={fadeInUp} className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
          <Rocket size={14} className="text-violet-400" />
          Launch a generation run
        </h2>
        <p className="text-[11px] text-surface-500 mt-0.5">
          Every run auto-creates a wrapping experiment so lift can be measured.
        </p>
      </header>

      <div className="rounded-xl border border-surface-800 bg-surface-950 p-4 space-y-3">
        {/* Hypothesis */}
        <Field label="Hypothesis" hint="Why are you running this? Becomes the experiment name.">
          <input
            type="text"
            value={form.hypothesis}
            onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
            placeholder="e.g. Hard PYQ-grounded LA atoms lift mastery"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Exam pack">
            <select
              value={form.exam_pack_id}
              onChange={(e) => setForm({ ...form, exam_pack_id: e.target.value })}
              className={inputCls}
            >
              <option value="gate-ma">gate-ma</option>
            </select>
          </Field>
          <Field label="Topic" hint="Optional. Leave blank for whole exam.">
            <input
              type="text"
              value={form.topic_id}
              onChange={(e) => setForm({ ...form, topic_id: e.target.value })}
              placeholder="linear-algebra"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Pipeline + Verification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="LLM">
            <select
              value={form.llm_model}
              onChange={(e) => setForm({ ...form, llm_model: e.target.value })}
              className={inputCls}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
              <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
              <option value="gpt-4o-mini">GPT-4o mini</option>
            </select>
          </Field>
          <Field label="Verification tier ceiling">
            <select
              value={form.tier_ceiling}
              onChange={(e) =>
                setForm({ ...form, tier_ceiling: e.target.value as FormState['tier_ceiling'] })
              }
              className={inputCls}
            >
              <option value="rag">RAG only (cheapest)</option>
              <option value="gemini">RAG + Gemini dual-solve</option>
              <option value="wolfram">Full cascade (RAG + Gemini + Wolfram)</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Toggle
            checked={form.pyq_grounding}
            onChange={(v) => setForm({ ...form, pyq_grounding: v })}
            label="PYQ grounding"
          />
          <Toggle
            checked={form.gemini_dual_solve}
            onChange={(v) => setForm({ ...form, gemini_dual_solve: v })}
            label="Dual-solve"
            disabled={form.tier_ceiling === 'rag'}
          />
          <Toggle
            checked={form.multi_llm_consensus}
            onChange={(v) => setForm({ ...form, multi_llm_consensus: v })}
            label="Multi-LLM consensus"
          />
          <Field label="Pedagogy">
            <select
              value={form.reviewer_strictness}
              onChange={(e) => setForm({ ...form, reviewer_strictness: e.target.value as FormState['reviewer_strictness'] })}
              className={inputCls}
            >
              <option value="lenient">Lenient</option>
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
            </select>
          </Field>
        </div>

        {/* Difficulty mix */}
        <Field label={`Difficulty mix (sums to ${diffSum})`} hint="Percent split across easy / medium / hard.">
          <div className="grid grid-cols-3 gap-2">
            <NumberInput value={form.difficulty_easy} onChange={(v) => setForm({ ...form, difficulty_easy: v })} prefix="Easy %" />
            <NumberInput value={form.difficulty_medium} onChange={(v) => setForm({ ...form, difficulty_medium: v })} prefix="Med %" />
            <NumberInput value={form.difficulty_hard} onChange={(v) => setForm({ ...form, difficulty_hard: v })} prefix="Hard %" />
          </div>
        </Field>

        {/* Quota */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Count">
            <NumberInput value={form.count} onChange={(v) => setForm({ ...form, count: v })} min={1} max={10000} />
          </Field>
          <Field label="Max cost (USD)">
            <NumberInput value={form.max_cost_usd} onChange={(v) => setForm({ ...form, max_cost_usd: v })} min={0.01} max={1000} step={0.5} />
          </Field>
        </div>

        {/* Estimate */}
        <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-surface-400">
              <Info size={12} />
              <span>Estimate</span>
            </div>
            {estimating && <Loader2 size={12} className="animate-spin text-violet-400" />}
          </div>
          {estimate ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs">
                <span className="text-surface-100 text-base font-semibold">${estimate.estimated_cost_usd.toFixed(3)}</span>
                <span className="text-surface-500">{estimate.estimated_duration_minutes.toFixed(1)} min</span>
                <span className="text-surface-500">{estimate.call_count} LLM calls</span>
                <span className="text-surface-500">${estimate.per_artifact_usd.toFixed(4)}/atom</span>
              </div>
              {estimate.warnings.length > 0 && (
                <ul className="space-y-1 mt-1.5">
                  {estimate.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                      <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="text-[11px] text-surface-500">Adjusting…</div>
          )}
        </div>

        {/* Errors / success */}
        {error && (
          <div className="rounded-lg p-2 text-xs bg-red-500/10 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg p-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={runEstimate}
            disabled={estimating}
            className="px-3 py-2 rounded-lg text-xs bg-surface-900 border border-surface-800 text-surface-300 hover:text-surface-100 disabled:opacity-50"
          >
            Re-estimate
          </button>
          <button
            onClick={handleLaunch}
            disabled={launching || estimating || diffSum === 0}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-violet-500 hover:bg-violet-400 text-white inline-flex items-center gap-2 disabled:opacity-50"
          >
            {launching ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
            {launching ? 'Launching…' : 'Launch'}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

// ============================================================================
// Form bits
// ============================================================================

const inputCls =
  'w-full px-2.5 py-1.5 rounded-md text-xs bg-surface-900 border border-surface-800 text-surface-100 focus:outline-none focus:border-violet-500/50 placeholder:text-surface-600';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-surface-500 font-medium">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-surface-600">{hint}</div>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={clsx('block space-y-1', disabled && 'opacity-40')}>
      <div className="text-[10px] uppercase tracking-wide text-surface-500 font-medium">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'w-full px-2.5 py-1.5 rounded-md text-xs font-medium border',
          checked
            ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
            : 'bg-surface-900 border-surface-800 text-surface-500 hover:text-surface-300',
        )}
      >
        {checked ? 'On' : 'Off'}
      </button>
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  prefix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {prefix && <span className="text-[10px] text-surface-600 whitespace-nowrap">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
        className={inputCls + ' font-mono'}
      />
    </div>
  );
}
