/**
 * PracticeAttemptPage — Wave 10: the practice surface for the Wave 9
 * server-side deterministic grading loop.
 *
 *   GET  /api/practice/item/:id   → render-safe item (question, kind,
 *                                    canonical options, marking display —
 *                                    NEVER the answer key)
 *   POST /api/practice/attempt    → structured response, graded on the
 *                                    server (GATE marking), fed into the
 *                                    student model (Elo + FSRS)
 *
 * Unlike SmartPracticePage (which compares strings client-side against a
 * correct_answer it was handed), this page never sees the answer: the
 * grade comes back from the server. `ts` is fixed once per item load so
 * a retried submit is idempotent (the server dedups on it).
 *
 * Routed at /attempt/:objectId; NextBestActionCard links here when a
 * practice/retain action carries an objectId.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authFetch } from '@/lib/auth/client';
import {
  CheckCircle2, XCircle, Loader2, ArrowLeft, SkipForward,
  Target, AlertTriangle, Compass, RefreshCw, GraduationCap, Repeat, GitBranch,
} from 'lucide-react';
import { ReceiptBorder } from '@/components/ui/ReceiptBorder';
import { Card } from '@/components/ui/Card';
import { receiptFromServerGrade } from '@/lib/receipt';
import { setDemoOutcome } from '@/lib/demoPersona';

interface PracticeItem {
  id: string;
  node_id: string;
  topic: string | null;
  question_text: string | null;
  est_minutes: number;
  gradable: boolean;
  question_type: 'mcq' | 'msq' | 'nat' | null;
  marks: number | null;
  options: string[] | null;
  marking: { marks_correct: number; marks_wrong: number } | null;
  not_gradable_reason: string | null;
}

interface AttemptResult {
  grade: { earned: number; max: number; correct: boolean; feedback: string };
  marking: { marks_correct: number; marks_wrong: number };
  /** Revealed only after the answer is committed; never on the item view. */
  solution_steps?: string[];
  recorded: boolean;
  /** T14 (B5, DR-4): populated only for a positive award — never a negative "-N min" line. */
  xp_minutes_awarded?: number | null;
  /**
   * W3.4/E2's diagnosis for a wrong mcq pick — the authored
   * distractor_failure_tags map, resolved server-side to the ONE option the
   * student actually chose (see practice-routes.ts's failureTagForWrongPick).
   * null on a correct/skipped/untagged attempt, never omitted.
   *
   * Found by /investigate (2026-08-30): the server has computed and shipped
   * this since W3.4, but nothing on this page ever read it — a fully-built
   * "which common mistake was this" signal was silently dropped on the
   * floor. See COMMON_MISTAKE_LABEL below for where it's now shown.
   */
  failure_tag?: string | null;
}

/**
 * Plain-language label per ErrorTag (src/core/interfaces.ts), for the
 * "common mistake" callout below. Student register only — names the
 * pattern so it's recognizable next time, never jargon, never a score.
 */
const COMMON_MISTAKE_LABEL: Record<string, string> = {
  sign: 'a sign error',
  unit: 'mixing up units',
  misread: 'misreading the question',
  transcription: 'copying a number wrong',
  method: 'the wrong method',
  careless: 'a careless slip',
  method_selection: 'picking the wrong approach',
  representation: 'misreading the representation',
  mode_msq: 'missing an option in a multi-select',
  mode_nat_entry: 'an entry-format slip',
  time_pressure: 'rushing under time pressure',
  risk_decision: 'a risky guess rather than a knowledge gap',
  prerequisite: 'a gap in an earlier concept, not this one',
};

/**
 * A wrong answer's `solution_steps` is a single canned route through ONE
 * problem (see `data/practice-items/*.json`). When the item's `topic` has a
 * real branching method-selection wizard (`method-selection-trainers.ts`),
 * the honest next move for "why did I pick the wrong approach" is that
 * wizard — it already asks "what kind of problem is this, and which method
 * fits" across several problem shapes, which is exactly what a step-reveal
 * solution for one instance cannot teach. Root-caused by /investigate
 * (2026-09-03): the wizard existed and covered this ground (linear-algebra's
 * `la_power`/`la_definite` nodes already branch on eigenvalue-power and
 * definiteness questions — the same territory as a spectral-theorem miss)
 * but was reachable only via a direct URL, never linked from the one moment
 * a student actually needs it. `topic` values come straight from the
 * practice-item bank and must match a trainer key/route exactly — an
 * unmapped topic (or none) renders no button rather than a guessed link.
 */
function wizardRouteForTopic(topic: string | null | undefined): string | null {
  if (typeof topic !== 'string') return null;
  // Practice-item banks are not fully consistent on topic casing (e.g. one
  // hand-authored file uses "Linear Algebra" where every other uses the
  // kebab-case slug) — normalize rather than require exact-match, since a
  // display-only casing difference is not a reason to withhold a real link.
  const slug = topic.trim().toLowerCase().replace(/\s+/g, '-');
  if (slug === 'linear-algebra' || slug === 'vector-calculus') return `/theorem-wizard/${slug}`;
  if (slug === 'probability-statistics') return '/distribution-selector';
  return null;
}

// Shared base for the two post-wrong-answer CTA buttons below — only
// background/border/color differ per button (indigo vs. green).
const NEXT_MOVE_BUTTON_BASE: CSSProperties = {
  flex: 1, minHeight: 44, padding: '0 12px', borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)',
  fontFamily: 'var(--font-sans)', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

export default function PracticeAttemptPage() {
  const { objectId } = useParams<{ objectId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<PracticeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [natValue, setNatValue] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  // E7: "New numbers, same concept"
  const [variantQuestion, setVariantQuestion] = useState<string | null>(null);
  const [generatingVariant, setGeneratingVariant] = useState(false);

  // Fixed per item load: idempotency key half + latency clock start.
  const attemptTs = useMemo(() => Date.now(), [objectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setItem(null);
    setResult(null);
    setSelectedIndex(null);
    setSelectedIndices(new Set());
    setNatValue('');

    authFetch(`/api/practice/item/${encodeURIComponent(objectId ?? '')}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
        return r.json();
      })
      .then((data: PracticeItem) => { if (!cancelled) setItem(data); })
      .catch(err => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [objectId]);

  const canSubmit = item?.gradable && !submitting && !result && (
    (item.question_type === 'mcq' && selectedIndex !== null) ||
    (item.question_type === 'msq' && selectedIndices.size > 0) ||
    (item.question_type === 'nat' && natValue.trim() !== '' && Number.isFinite(Number(natValue)))
  );

  async function submit(skipped = false) {
    if (!item || submitting || result) return;
    setSubmitting(true);
    setSubmitError(null);

    const response = skipped
      ? { skipped: true }
      : item.question_type === 'mcq' ? { selectedIndex }
      : item.question_type === 'msq' ? { selectedIndices: [...selectedIndices] }
      : { value: Number(natValue) };

    try {
      const r = await authFetch('/api/practice/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: item.id,
          response,
          latency_ms: Date.now() - attemptTs,
          ts: attemptTs,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setResult(data as AttemptResult);
      // Hand the graded outcome to the demo rail. The caption reframe and the
      // re-targeted ending both depend on what actually happened — recorded
      // from the server's grade, never inferred, because that moment is the
      // one the whole miss choreography rests on.
      setDemoOutcome({ objectId: item.id, correct: (data as AttemptResult).grade.correct });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchNewNumbers() {
    if (!item || generatingVariant || result) return;
    setGeneratingVariant(true);
    setVariantQuestion(null);
    try {
      const r = await authFetch(`/api/practice/new-numbers/${encodeURIComponent(item.id)}`, { method: 'POST' });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setVariantQuestion(data?.question_text ?? null);
    } catch {
      setVariantQuestion(null);
    } finally {
      setGeneratingVariant(false);
    }
  }

  function toggleIndex(i: number) {
    if (result) return;
    if (item?.question_type === 'mcq') {
      setSelectedIndex(i);
    } else {
      setSelectedIndices(prev => {
        const next = new Set(prev);
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
      });
    }
  }

  const isPicked = (i: number) =>
    item?.question_type === 'mcq' ? selectedIndex === i : selectedIndices.has(i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link
        to="/planned"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={13} /> Back to your plan
      </Link>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 'var(--text-body)', padding: '48px 0', justifyContent: 'center' }}>
          <Loader2 size={16} className="animate-spin" /> Loading item…
        </div>
      )}

      {loadError && (
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-body)', color: 'var(--red)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Couldn't load this item</p>
            <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{loadError}</p>
            <Link to="/smart-practice" style={{ marginTop: 8, display: 'inline-block', color: 'var(--green-ink)', textDecoration: 'none' }}>Practice something else →</Link>
          </div>
        </div>
      )}

      {item && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card radius="var(--radius-md)" padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption2)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
              <Target size={12} />
              {item.topic ?? item.node_id}
              {item.question_type && (
                <span style={{ color: 'var(--text-tertiary)', textTransform: 'none' }}>· {item.question_type.toUpperCase()}</span>
              )}
            </div>
            {item.marking && (
              <span style={{ fontSize: 'var(--text-caption2)', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)' }}>
                correct +{fmt(item.marking.marks_correct)} · wrong {item.marking.marks_wrong === 0 ? '0' : fmt(item.marking.marks_wrong)}
              </span>
            )}
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
              {variantQuestion ?? item.question_text ?? 'This item has no question text.'}
            </p>
            {variantQuestion && (
              <p style={{ margin: '6px 0 0', fontSize: 'var(--text-subhead)', color: 'var(--text-tertiary)' }}>
                ↑ New numbers — same concept. Submit the original item above for grading.
              </p>
            )}
          </div>

          {/* E7: New numbers button — only for NAT/MCQ items, before result */}
          {(item.question_type === 'nat' || item.question_type === 'mcq') && !result && (
            <button
              onClick={fetchNewNumbers}
              disabled={generatingVariant}
              title="Same concept, different numbers — self-check only"
              style={{
                alignSelf: 'flex-start',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--indigo-ink)',
                fontSize: 'var(--text-caption)',
                fontFamily: 'var(--font-sans)',
                cursor: generatingVariant ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {generatingVariant
                ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                : <><RefreshCw size={12} /> New numbers, same concept</>
              }
            </button>
          )}

          {!item.gradable && (
            <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,159,10,.06)', border: '1px solid rgba(255,159,10,.22)', fontSize: 'var(--text-subhead)', color: 'var(--orange)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>Display-only practice</p>
                <p style={{ margin: '4px 0 0', opacity: 0.8 }}>
                  This item isn't deterministically gradable yet — work it on paper, then
                  {' '}<Link to="/smart-practice" style={{ color: 'var(--green-ink)', textDecoration: 'none' }}>practice a graded set →</Link>
                </p>
              </div>
            </div>
          )}

          {item.gradable && item.options && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              role={item.question_type === 'mcq' ? 'radiogroup' : 'group'}
              aria-label={item.question_text ?? undefined}
              onKeyDown={(e) => {
                if (!item.options) return;
                const focusable = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
                const idx = focusable.findIndex((el) => el === document.activeElement);
                if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && idx >= 0) {
                  e.preventDefault();
                  focusable[(idx + 1) % focusable.length]?.focus();
                } else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && idx >= 0) {
                  e.preventDefault();
                  focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
                }
              }}
            >
              {item.question_type === 'msq' && (
                <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-tertiary)' }}>Select every correct option — full marks only for the exact set.</p>
              )}
              {item.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={!!result || submitting}
                  onClick={() => toggleIndex(i)}
                  role={item.question_type === 'mcq' ? 'radio' : 'checkbox'}
                  aria-checked={isPicked(i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `var(--hairline) solid ${isPicked(i) ? 'var(--text-secondary)' : 'var(--separator)'}`,
                    background: isPicked(i) ? 'var(--surface-fill)' : 'transparent',
                    color: isPicked(i) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-body)',
                    fontFamily: 'var(--font-sans)',
                    cursor: result || submitting ? 'default' : 'pointer',
                    opacity: result || submitting ? 0.7 : 1,
                    fontWeight: isPicked(i) ? 'var(--weight-medium)' : undefined,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', marginRight: 8, fontWeight: 'var(--weight-bold)' }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {item.gradable && item.question_type === 'nat' && (
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={natValue}
              disabled={!!result || submitting}
              onChange={e => setNatValue(e.target.value)}
              placeholder="Numeric answer…"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-body)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}

          {item.gradable && !result && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => submit(false)}
                disabled={!canSubmit}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 'var(--radius-sm)',
                  background: canSubmit ? 'var(--green)' : 'var(--surface-fill)',
                  color: canSubmit ? '#fff' : 'var(--text-tertiary)',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-body)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Submit
              </button>
              <button
                onClick={() => submit(true)}
                disabled={submitting}
                title="Skipping earns and costs nothing"
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-fill)',
                  border: 'var(--hairline) solid var(--separator)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-body)',
                  fontFamily: 'var(--font-sans)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <SkipForward size={13} /> Skip
              </button>
            </div>
          )}

          {submitError && (
            <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--red)' }}>
              {submitError} — your answer wasn't lost; try Submit again.
            </p>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${result.grade.correct ? 'rgba(52,199,89,.25)' : 'rgba(255,59,48,.25)'}`,
                background: result.grade.correct ? 'rgba(52,199,89,.06)' : 'rgba(255,59,48,.06)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                {result.grade.correct
                  ? <CheckCircle2 size={15} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
                  : <XCircle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />}
                <div style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  {/* Server-graded: GateDeterministicScorer computed this on the
                      server from the canonical answer key, which the client
                      never sees. That's a real backing verification, not a
                      client-side string match — earns the receipt border. */}
                  <ReceiptBorder receipt={receiptFromServerGrade(result.grade)} tone={result.grade.correct ? 'positive' : 'neutral'}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                      {result.grade.correct ? 'Correct' : 'Not this time'} — {fmt(result.grade.earned)} / {fmt(result.grade.max)} marks
                    </p>
                    <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{result.grade.feedback}</p>
                  </ReceiptBorder>
                  {/* Common-mistake callout (/investigate, 2026-08-30). Same
                      icon + --orange identity as a lesson's Common Traps
                      atom (AtomCardRenderer.tsx) — a subtle, quiet line, not
                      a banner, so the pattern reads as recognizable rather
                      than as a second scolding on top of "Not this time". */}
                  {!result.grade.correct && result.failure_tag && (
                    <p style={{
                      margin: '6px 0 0', display: 'flex', alignItems: 'flex-start', gap: 6,
                      color: 'var(--orange)',
                    }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>
                        Common trap: {COMMON_MISTAKE_LABEL[result.failure_tag] ?? result.failure_tag}. Worth watching for next time.
                      </span>
                    </p>
                  )}
                  {/* Full-step reveal. Withheld until the answer is committed —
                      the item view never carries it — and shown either way: a
                      student who missed needs the steps most, and one who got
                      it right should be able to check their route rather than
                      trust the mark. */}
                  {!!result.solution_steps?.length && (
                    <ol style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.solution_steps.map((s, i) => (
                        <li key={i} style={{ fontSize: 'var(--text-body)', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{s}</li>
                      ))}
                    </ol>
                  )}
                  {/* Two concrete next moves, not just the generic "What's
                      next for me?" system link below. A wrong answer is
                      choosing between "I don't understand this concept" (go
                      learn it) and "I get it, let me try another" (go
                      practice it); a correct answer only needs the second —
                      offering remediation for something the student just
                      proved they know would be backwards. (/investigate,
                      2026-09-02 first added this for wrong answers only; a
                      follow-up the same day found the row was
                      unconditionally hidden after a correct answer too —
                      "Smart Practice gives no way to keep practicing after
                      getting it right" — so the row now always renders, and
                      only the remediation button is gated on the miss.)

                      /investigate (2026-09-03) found a THIRD button —
                      "Which method applies?" stacked above this row — read
                      as decision overload right after a miss (3 buttons + a
                      text link competing for the one focal action Vidhya
                      Clarity calls for). The wizard link and "Explore this
                      concept" are both "go learn" moves, so they now share
                      ONE slot instead of stacking: the wizard wins only when
                      the server's own diagnosis says the miss WAS a method
                      choice (`failure_tag` is 'method_selection' or
                      'method') and the topic has a real trainer; every other
                      wrong answer — including an untagged one, since a
                      guessed diagnosis is worse than the safe generic
                      default — gets the concept lesson instead. */}
                  {item?.node_id && (
                    <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                      {!result.grade.correct && (() => {
                        const isMethodMiss = result.failure_tag === 'method_selection' || result.failure_tag === 'method';
                        const wizardBaseRoute = isMethodMiss ? wizardRouteForTopic(item.topic) : null;
                        // Carries the concept + diagnosed mistake so the
                        // wizard can connect the tree back to what actually
                        // went wrong (/investigate, 2026-09-03) instead of
                        // opening as a disconnected generic tool.
                        const wizardRoute = wizardBaseRoute
                          ? `${wizardBaseRoute}?concept=${encodeURIComponent(item.node_id)}&mistake=${encodeURIComponent(COMMON_MISTAKE_LABEL[result.failure_tag!] ?? '')}`
                          : null;
                        return wizardRoute ? (
                          <button
                            type="button"
                            onClick={() => navigate(wizardRoute)}
                            style={{
                              ...NEXT_MOVE_BUTTON_BASE,
                              background: 'var(--indigo-tint)', border: 'var(--hairline) solid var(--indigo)',
                              color: 'var(--indigo-ink)',
                            }}
                          >
                            <GitBranch size={14} /> Which method applies?
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/lesson/${encodeURIComponent(item.node_id)}`)}
                            style={{
                              ...NEXT_MOVE_BUTTON_BASE,
                              background: 'var(--indigo-tint)', border: 'var(--hairline) solid var(--indigo)',
                              color: 'var(--indigo-ink)',
                            }}
                          >
                            <GraduationCap size={14} /> Explore this concept
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => navigate(`/smart-practice?concept=${encodeURIComponent(item.node_id)}`)}
                        style={{
                          ...NEXT_MOVE_BUTTON_BASE,
                          background: 'var(--green)', border: 'none',
                          color: 'var(--text-on-accent)',
                        }}
                      >
                        <Repeat size={14} /> Practice more like this
                      </button>
                    </div>
                  )}
                  {!result.recorded && (
                    <p style={{ margin: 0, color: 'var(--orange)', paddingTop: 4 }}>
                      Graded, but not recorded to your model (server storage unavailable).
                    </p>
                  )}
                  {/* DR-4: one quiet line, no toast, no floating number — and
                      only ever positive (a wrong-MCQ's negative XP event is
                      written server-side but never shown here). */}
                  {!!result.xp_minutes_awarded && result.xp_minutes_awarded > 0 && (
                    <p style={{ margin: 0, color: 'var(--green-ink)', paddingTop: 4 }}>
                      +{result.xp_minutes_awarded} min of focused work
                    </p>
                  )}
                  <Link to="/planned" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green-ink)', textDecoration: 'none', paddingTop: 4 }}>
                    <Compass size={12} /> What's next for me?
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
        </motion.div>
      )}
    </div>
  );
}
