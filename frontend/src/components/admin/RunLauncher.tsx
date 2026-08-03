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
import {
  dryRun,
  createRun,
  getLastRunConfig,
  searchConcepts,
  generateObjectivesStub,
  type CostEstimate,
  type GenerationRunConfig,
  type ConceptSearchHit,
} from '@/api/admin/content-rd';

interface Props {
  defaultExam?: string;
  onLaunched?: (runId: string) => void;
  /** Set when arriving from BlueprintsPage's "Launch this blueprint" CTA.
   *  Pre-fills unit mode + concept/exam fields and threads blueprint_id
   *  through to createRun() so the backend derives the unit spec from the
   *  blueprint's own stage decisions (§14.2) instead of the manual form. */
  initialBlueprint?: {
    id: string;
    concept_id: string;
    exam_pack_id: string;
    unit_name?: string;
  } | null;
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
  /** Phase 3 of Curriculum R&D — when true, the run produces curriculum_units. */
  unit_mode: boolean;
  unit_concept_id: string;
  unit_name: string;
  /** Newline-delimited "id|statement" lines, parsed at submit. */
  unit_objectives_text: string;
  /** Newline-delimited PYQ ids. */
  unit_pyqs_text: string;
  unit_atom_kinds: string[];
}

const DEFAULT_ATOM_KINDS = ['intuition', 'formal_definition', 'worked_example', 'practice'];

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
  unit_mode: false,
  unit_concept_id: '',
  unit_name: '',
  unit_objectives_text: '',
  unit_pyqs_text: '',
  unit_atom_kinds: DEFAULT_ATOM_KINDS,
};

/** Parse "id|statement" lines into structured objectives. Skips blanks. */
function parseObjectives(text: string): Array<{ id: string; statement: string }> {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const idx = line.indexOf('|');
      if (idx < 0) return { id: `obj_${i + 1}`, statement: line };
      const id = line.slice(0, idx).trim() || `obj_${i + 1}`;
      const statement = line.slice(idx + 1).trim();
      return { id, statement };
    })
    .filter((o) => o.statement.length > 0);
}

/** Parse newline-delimited list, dropping blanks + dedup. */
function parseLines(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    ),
  );
}

function buildConfig(form: FormState): GenerationRunConfig {
  return {
    target: {
      topic_id: form.topic_id || undefined,
      difficulty_dist: {
        easy: form.difficulty_easy,
        medium: form.difficulty_medium,
        hard: form.difficulty_hard,
      },
      // When unit_mode is on, emit a single curriculum_unit_spec built from
      // the unit fields. Backend dispatches into the unit orchestrator
      // (PR #32) when this array is non-empty.
      curriculum_unit_specs: form.unit_mode && form.unit_concept_id && form.unit_name
        ? [
            {
              exam_pack_id: form.exam_pack_id,
              concept_id: form.unit_concept_id,
              name: form.unit_name,
              hypothesis: form.hypothesis || undefined,
              learning_objectives: parseObjectives(form.unit_objectives_text),
              prepared_for_pyq_ids: parseLines(form.unit_pyqs_text),
              atom_kinds: form.unit_atom_kinds.length > 0 ? form.unit_atom_kinds : DEFAULT_ATOM_KINDS,
            },
          ]
        : undefined,
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-caption)',
  background: 'var(--surface-fill)',
  border: 'var(--hairline) solid var(--separator)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const toggleActiveStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  background: 'rgba(88,86,214,.08)',
  border: '1px solid rgba(88,86,214,.3)',
  color: 'var(--indigo-ink)',
};

const toggleInactiveStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  background: 'var(--surface-fill)',
  border: 'var(--hairline) solid var(--separator)',
  color: 'var(--text-tertiary)',
};

export function RunLauncher({ defaultExam, onLaunched, initialBlueprint }: Props) {
  const [form, setForm] = useState<FormState>(() => initialBlueprint
    ? {
        ...DEFAULT_FORM,
        exam_pack_id: initialBlueprint.exam_pack_id,
        unit_mode: true,
        unit_concept_id: initialBlueprint.concept_id,
        unit_name: initialBlueprint.unit_name || initialBlueprint.concept_id,
        hypothesis: `Launch from blueprint: ${initialBlueprint.concept_id}`,
      }
    : {
        ...DEFAULT_FORM,
        exam_pack_id: defaultExam ?? DEFAULT_FORM.exam_pack_id,
      });
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const blueprintId = initialBlueprint?.id ?? null;

  // PR-A — Prefilled defaults: pre-fill the form from the exam's most
  // recent COMPLETE run when the operator changes exam_pack_id. Best-
  // effort, never blocking. If no last config exists or it fails to
  // validate, leaves the current form values alone.
  const [prefilledFromRunId, setPrefilledFromRunId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await getLastRunConfig(form.exam_pack_id);
        if (cancelled || !r.config) return;
        // Map server-shape config → FormState fields. Only fields we
        // own are touched; user-typed values like hypothesis are NOT
        // overwritten.
        setForm((prev) => ({
          ...prev,
          llm_model: r.config!.pipeline?.llm_models?.[0] ?? prev.llm_model,
          pyq_grounding: r.config!.pipeline?.pyq_grounding ?? prev.pyq_grounding,
          multi_llm_consensus: r.config!.pipeline?.multi_llm_consensus ?? prev.multi_llm_consensus,
          tier_ceiling: r.config!.verification?.tier_ceiling ?? prev.tier_ceiling,
          gemini_dual_solve: r.config!.verification?.gemini_dual_solve ?? prev.gemini_dual_solve,
          reviewer_strictness: r.config!.pedagogy?.reviewer_strictness ?? prev.reviewer_strictness,
          count: r.config!.quota?.count ?? prev.count,
          max_cost_usd: r.config!.quota?.max_cost_usd ?? prev.max_cost_usd,
          difficulty_easy: r.config!.target?.difficulty_dist?.easy ?? prev.difficulty_easy,
          difficulty_medium: r.config!.target?.difficulty_dist?.medium ?? prev.difficulty_medium,
          difficulty_hard: r.config!.target?.difficulty_dist?.hard ?? prev.difficulty_hard,
        }));
        setPrefilledFromRunId(r.source_run_id ?? null);
      } catch {
        // silent — pre-fill is best-effort, never blocks operator
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.exam_pack_id]);

  // Concept autocomplete (debounced)
  const [conceptHits, setConceptHits] = useState<ConceptSearchHit[]>([]);
  const [showConceptHits, setShowConceptHits] = useState(false);
  const conceptDebounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!form.unit_mode) return;
    if (conceptDebounceRef.current) window.clearTimeout(conceptDebounceRef.current);
    conceptDebounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchConcepts(form.exam_pack_id, form.unit_concept_id, 8);
        setConceptHits(r.hits);
      } catch {
        setConceptHits([]);
      }
    }, 200);
    return () => {
      if (conceptDebounceRef.current) window.clearTimeout(conceptDebounceRef.current);
    };
  }, [form.exam_pack_id, form.unit_concept_id, form.unit_mode]);

  const [generatingObjectives, setGeneratingObjectives] = useState(false);
  async function handleGenerateObjectives() {
    if (!form.unit_concept_id) return;
    setGeneratingObjectives(true);
    try {
      const r = await generateObjectivesStub(form.unit_concept_id, form.unit_atom_kinds);
      const text = r.objectives.map((o) => `${o.id}|${o.statement}`).join('\n');
      setForm((prev) => ({ ...prev, unit_objectives_text: text }));
    } catch {
      // silent — operator can type manually
    } finally {
      setGeneratingObjectives(false);
    }
  }

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
        blueprint_id: blueprintId ?? undefined,
      });
      setSuccess(
        r.blueprint_warning
          ? `Launched ${r.run.id} (queued) — ${r.blueprint_warning}`
          : `Launched ${r.run.id}. Generation is running in the background — watch its progress in Active runs below, then check the Effectiveness ledger once mastery signal comes in.`,
      );
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
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <header>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Rocket size={14} style={{ color: 'var(--indigo-ink)' }} />
          Launch a generation run
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Every run auto-creates a wrapping experiment so lift can be measured.
        </p>
        {blueprintId ? (
          <p style={{ fontSize: '10px', color: 'var(--indigo-ink)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            ⤷ launching from blueprint <span style={{ fontWeight: 600 }}>{blueprintId}</span> — stages + constraints come from the blueprint, not this form
          </p>
        ) : prefilledFromRunId && (
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            ⤺ pre-filled from run <span style={{ color: 'var(--indigo-ink)' }}>{prefilledFromRunId}</span>
          </p>
        )}
      </header>

      <div style={{ borderRadius: '12px', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-card)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Generation mode toggle — atom (default) vs curriculum unit (Phase 2/3) */}
        <Field label="Generation mode" hint="Atoms = legacy single-problem generation. Curriculum unit = PR #32+: bundles multiple atoms in pedagogical sequence with declared learning objectives + PYQ alignment.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, unit_mode: false })}
              style={!form.unit_mode ? toggleActiveStyle : toggleInactiveStyle}
            >
              Atoms
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, unit_mode: true })}
              style={form.unit_mode ? toggleActiveStyle : toggleInactiveStyle}
            >
              Curriculum unit
            </button>
          </div>
        </Field>

        {/* Hypothesis */}
        <Field label="Hypothesis" hint="Why are you running this? Becomes the experiment name.">
          <input
            type="text"
            value={form.hypothesis}
            onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
            placeholder="e.g. Hard PYQ-grounded LA atoms lift mastery"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <Field label="Exam pack">
            <select
              value={form.exam_pack_id}
              onChange={(e) => setForm({ ...form, exam_pack_id: e.target.value })}
              style={inputStyle}
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
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Curriculum unit fields — only shown in unit_mode */}
        {form.unit_mode && (
          <div style={{ borderRadius: '8px', border: '1px solid rgba(88,86,214,.25)', background: 'rgba(88,86,214,.05)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--indigo-ink)', fontWeight: 500 }}>
              Curriculum unit spec
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <Field label="Concept ID" hint="Single concept this unit covers (eng-review D1).">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={form.unit_concept_id}
                    onChange={(e) => setForm({ ...form, unit_concept_id: e.target.value })}
                    onFocus={() => setShowConceptHits(true)}
                    onBlur={() => setTimeout(() => setShowConceptHits(false), 150)}
                    placeholder="eigenvalues"
                    style={inputStyle}
                    autoComplete="off"
                  />
                  {showConceptHits && conceptHits.length > 0 && (
                    <ul style={{ position: 'absolute', zIndex: 20, marginTop: '4px', width: '100%', maxHeight: '192px', overflowY: 'auto', borderRadius: '6px', border: '1px solid rgba(88,86,214,.3)', background: 'var(--surface-card)', boxShadow: '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)', listStyle: 'none', padding: 0, margin: 0 }}>
                      {conceptHits.map((h) => (
                        <li key={h.concept_id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()} // keeps focus during click
                            onClick={() => {
                              setForm((p) => ({ ...p, unit_concept_id: h.concept_id }));
                              setShowConceptHits(false);
                            }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--indigo-ink)' }}>{h.concept_id}</span>
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>· {h.topic_title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Field>
              <Field label="Unit name">
                <input
                  type="text"
                  value={form.unit_name}
                  onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
                  placeholder="Eigenvalues — intro"
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field
              label={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                  <span>Learning objectives</span>
                  <button
                    type="button"
                    onClick={handleGenerateObjectives}
                    disabled={!form.unit_concept_id || generatingObjectives}
                    style={{ fontSize: '10px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.3)', color: 'var(--indigo-ink)', cursor: (!form.unit_concept_id || generatingObjectives) ? 'not-allowed' : 'pointer', opacity: (!form.unit_concept_id || generatingObjectives) ? 0.4 : 1 }}
                  >
                    {generatingObjectives ? '…' : 'Generate from concept'}
                  </button>
                </span>
              }
              hint='One per line, "id|statement". e.g. obj_1|Define eigenvalue for a 2×2 matrix'
            >
              <textarea
                value={form.unit_objectives_text}
                onChange={(e) => setForm({ ...form, unit_objectives_text: e.target.value })}
                rows={4}
                placeholder={'obj_1|Define eigenvalue for a 2×2 matrix\nobj_2|Compute via characteristic polynomial'}
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              />
            </Field>
            <Field
              label="Prepared-for PYQ IDs"
              hint="One PYQ id per line. The unit promises to prepare the student for these (uses holdout PYQs for lift)."
            >
              <textarea
                value={form.unit_pyqs_text}
                onChange={(e) => setForm({ ...form, unit_pyqs_text: e.target.value })}
                rows={3}
                placeholder={'pyq_2018_q42\npyq_2020_q31'}
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              />
            </Field>
            <Field label="Atom kinds (in pedagogical sequence)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['intuition', 'formal_definition', 'visual_analogy', 'worked_example', 'practice'].map((k) => {
                  const active = form.unit_atom_kinds.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? form.unit_atom_kinds.filter((x) => x !== k)
                          : [...form.unit_atom_kinds, k];
                        setForm({ ...form, unit_atom_kinds: next });
                      }}
                      style={active ? {
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                        background: 'rgba(88,86,214,.08)', border: '1px solid rgba(88,86,214,.3)', color: 'var(--indigo-ink)',
                      } : {
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                        background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-tertiary)',
                      }}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        )}

        {/* Pipeline + Verification */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <Field
            label="LLM"
            hint="Primary model for this run's generation. Math atoms (formal definition, worked example) also get an automatic second opinion from a different provider for consensus — this pick doesn't change that safety check, only which provider leads."
          >
            <select
              value={form.llm_model}
              onChange={(e) => setForm({ ...form, llm_model: e.target.value })}
              style={inputStyle}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
              <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
              <option value="gpt-4o-mini">GPT-4o mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (via OpenRouter)</option>
              <option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5 (via OpenRouter)</option>
            </select>
          </Field>
          <Field label="Verification tier ceiling">
            <select
              value={form.tier_ceiling}
              onChange={(e) =>
                setForm({ ...form, tier_ceiling: e.target.value as FormState['tier_ceiling'] })
              }
              style={inputStyle}
            >
              <option value="rag">RAG only (cheapest)</option>
              <option value="gemini">RAG + Gemini dual-solve</option>
              <option value="wolfram">Full cascade (RAG + Gemini + Wolfram)</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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
              style={inputStyle}
            >
              <option value="lenient">Lenient</option>
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
            </select>
          </Field>
        </div>

        {/* Difficulty mix */}
        <Field label={`Difficulty mix (sums to ${diffSum})`} hint="Percent split across easy / medium / hard.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <NumberInput value={form.difficulty_easy} onChange={(v) => setForm({ ...form, difficulty_easy: v })} prefix="Easy %" />
            <NumberInput value={form.difficulty_medium} onChange={(v) => setForm({ ...form, difficulty_medium: v })} prefix="Med %" />
            <NumberInput value={form.difficulty_hard} onChange={(v) => setForm({ ...form, difficulty_hard: v })} prefix="Hard %" />
          </div>
        </Field>

        {/* Quota */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Count">
            <NumberInput value={form.count} onChange={(v) => setForm({ ...form, count: v })} min={1} max={10000} />
          </Field>
          <Field label="Max cost (USD)">
            <NumberInput value={form.max_cost_usd} onChange={(v) => setForm({ ...form, max_cost_usd: v })} min={0.01} max={1000} step={0.5} />
          </Field>
        </div>

        {/* Estimate */}
        <div style={{ borderRadius: '8px', border: 'var(--hairline) solid var(--separator)', background: 'var(--surface-fill)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Info size={12} />
              <span>Estimate</span>
            </div>
            {estimating && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--indigo-ink)' }} />}
          </div>
          {estimate ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: '16px', rowGap: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>${estimate.estimated_cost_usd.toFixed(3)}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{estimate.estimated_duration_minutes.toFixed(1)} min</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{estimate.call_count} LLM calls</span>
                <span style={{ color: 'var(--text-tertiary)' }}>${estimate.per_artifact_usd.toFixed(4)}/atom</span>
              </div>
              {estimate.warnings.length > 0 && (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', listStyle: 'none', padding: 0 }}>
                  {estimate.warnings.map((w, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: 'var(--orange)' }}>
                      <AlertTriangle size={11} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Adjusting…</div>
          )}
        </div>

        {/* Errors / success */}
        {error && (
          <div style={{ borderRadius: '8px', padding: '8px', fontSize: '12px', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', color: 'var(--red)' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ borderRadius: '8px', padding: '8px', fontSize: '12px', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', color: 'var(--green-ink)', fontFamily: 'var(--font-mono)' }}>
            {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
          <button
            onClick={runEstimate}
            disabled={estimating}
            style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', cursor: estimating ? 'not-allowed' : 'pointer', opacity: estimating ? 0.5 : 1 }}
          >
            Re-estimate
          </button>
          <button
            onClick={handleLaunch}
            disabled={launching || estimating || diffSum === 0}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: 'var(--indigo)', color: 'var(--text-on-accent)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: (launching || estimating || diffSum === 0) ? 'not-allowed' : 'pointer', opacity: (launching || estimating || diffSum === 0) ? 0.5 : 1 }}
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

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{hint}</div>}
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
    <label style={{ display: 'block', opacity: disabled ? 0.4 : 1 }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={checked ? toggleActiveStyle : toggleInactiveStyle}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {prefix && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{prefix}</span>}
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
        style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
      />
    </div>
  );
}

// Exported for tests (do not import outside test files)
export const __testing = { parseObjectives, parseLines };
