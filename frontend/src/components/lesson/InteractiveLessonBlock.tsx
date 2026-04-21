/**
 * InteractiveLessonBlock — renders any InteractiveBlock from the
 * backend rendering layer with channel-appropriate animations.
 *
 * Each block type has a dedicated renderer:
 *   step-reveal         → collapsed cards, tap to reveal next step
 *   flip-card           → 3D CSS flip
 *   quick-check         → tap feedback with animated color + hint
 *   animated-derivation → lines fade in sequentially + replay button
 *   drag-match          → drag-to-match (touch + mouse)
 *   callout             → attention-grabbing badge
 *
 * All animations respect prefers-reduced-motion. Degrades to static
 * content for users with that preference.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronRight, Lightbulb, AlertTriangle, Sparkles,
  RotateCw, CheckCircle, XCircle, ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// Types — mirrors backend src/rendering/types.ts
// ============================================================================

interface RevealFragment { id: string; label?: string; content_md: string; latex?: string; }
interface StepReveal { kind: 'step-reveal'; id: string; title?: string; steps: RevealFragment[]; key_step_index?: number; }
interface FlipCard { kind: 'flip-card'; id: string; title?: string; cards: Array<{ id: string; prompt: RevealFragment; explanation: RevealFragment; student_quote?: string; }>; }
interface QuickCheck { kind: 'quick-check'; id: string; prompt_md: string; options: Array<{ id: string; text: string; latex?: string; is_correct: boolean; feedback_if_wrong_md?: string; }>; correct_feedback_md: string; }
interface AnimatedDerivation { kind: 'animated-derivation'; id: string; title?: string; lines: Array<{ id: string; latex: string; rationale_md: string; }>; }
interface DragMatch { kind: 'drag-match'; id: string; title?: string; pairs: Array<{ id: string; left: RevealFragment; right: RevealFragment; }>; right_decoys?: RevealFragment[]; }
interface Callout { kind: 'callout'; id: string; mood: 'tip' | 'warning' | 'insight' | 'gotcha'; content_md: string; }

type Block = StepReveal | FlipCard | QuickCheck | AnimatedDerivation | DragMatch | Callout;

// ============================================================================
// Top-level dispatcher
// ============================================================================

export function InteractiveLessonBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case 'callout':             return <CalloutView block={block} />;
    case 'step-reveal':         return <StepRevealView block={block} />;
    case 'flip-card':           return <FlipCardView block={block} />;
    case 'quick-check':         return <QuickCheckView block={block} />;
    case 'animated-derivation': return <AnimatedDerivationView block={block} />;
    case 'drag-match':          return <DragMatchView block={block} />;
  }
}

// ============================================================================
// Callout — animated badge, entry transition
// ============================================================================

function CalloutView({ block }: { block: Callout }) {
  const reduce = useReducedMotion();
  const cfg = {
    tip:     { Icon: Lightbulb,      tone: 'bg-sky-500/10 border-sky-500/30 text-sky-100',      label: 'TIP' },
    insight: { Icon: Sparkles,       tone: 'bg-violet-500/10 border-violet-500/30 text-violet-100', label: 'INSIGHT' },
    warning: { Icon: AlertTriangle,  tone: 'bg-amber-500/10 border-amber-500/30 text-amber-100', label: 'WARNING' },
    gotcha:  { Icon: AlertTriangle,  tone: 'bg-rose-500/10 border-rose-500/30 text-rose-100',    label: 'GOTCHA' },
  }[block.mood];
  const Icon = cfg.Icon;

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 8 }}
      animate={reduce ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx('p-4 rounded-xl border', cfg.tone)}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={14} className="shrink-0 mt-0.5 opacity-90" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">{cfg.label}</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{block.content_md}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Step Reveal — progressive disclosure with slide-in animation
// ============================================================================

function StepRevealView({ block }: { block: StepReveal }) {
  const [revealed, setRevealed] = useState(1);
  const reduce = useReducedMotion();
  const canReveal = revealed < block.steps.length;

  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 space-y-3">
      {block.title && (
        <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">{block.title}</p>
      )}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {block.steps.slice(0, revealed).map((step, idx) => (
            <motion.div
              key={step.id}
              initial={reduce ? {} : { opacity: 0, x: -8 }}
              animate={reduce ? {} : { opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={clsx(
                'p-3 rounded-lg border',
                block.key_step_index === idx
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-surface-950/60 border-surface-800',
              )}
            >
              <p className="text-[10px] text-surface-500 uppercase tracking-wide font-medium mb-1">
                {step.label || `Step ${idx + 1}`}
                {block.key_step_index === idx && <span className="ml-1 text-amber-400">⭐ key step</span>}
              </p>
              <p className="text-sm text-surface-200 whitespace-pre-wrap leading-relaxed">{step.content_md}</p>
              {step.latex && (
                <div className="mt-2 p-2 rounded bg-surface-900 font-mono text-xs text-sky-300 overflow-x-auto">
                  {step.latex}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {canReveal && (
        <button
          onClick={() => setRevealed(r => Math.min(r + 1, block.steps.length))}
          className="w-full h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-sky-500/20"
        >
          Next step ({block.steps.length - revealed} more)
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Flip Card — 3D flip animation per card
// ============================================================================

function FlipCardView({ block }: { block: FlipCard }) {
  return (
    <div className="space-y-3">
      {block.title && (
        <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">{block.title}</p>
      )}
      <div className="space-y-2.5">
        {block.cards.map((card, idx) => <FlipCardItem key={card.id} card={card} index={idx} />)}
      </div>
    </div>
  );
}

function FlipCardItem({ card, index }: { card: FlipCard['cards'][number]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="relative" style={{ perspective: '800px' }}>
      <motion.div
        animate={reduce ? {} : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Front */}
        <button
          onClick={() => setFlipped(true)}
          className="w-full p-4 rounded-xl bg-rose-500/5 border border-rose-500/25 text-left hover:bg-rose-500/10 transition-colors"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <span className="text-[10px] font-bold text-rose-300">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-rose-400 uppercase tracking-wide font-medium mb-1">Common trap</p>
              {card.student_quote && (
                <p className="text-[11px] text-surface-400 italic mb-1.5">"{card.student_quote}"</p>
              )}
              <p className="text-sm text-surface-200 whitespace-pre-wrap">{card.prompt.content_md}</p>
              <p className="text-[10px] text-rose-300 mt-2 inline-flex items-center gap-0.5">
                Tap to see why
                <RotateCw size={9} />
              </p>
            </div>
          </div>
        </button>

        {/* Back */}
        <button
          onClick={() => setFlipped(false)}
          className="absolute inset-0 w-full p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 text-left hover:bg-emerald-500/10"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-start gap-2.5">
            <Lightbulb size={14} className="shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wide font-medium mb-1">Why it happens</p>
              <p className="text-sm text-surface-200 whitespace-pre-wrap">{card.explanation.content_md}</p>
              <p className="text-[10px] text-emerald-300 mt-2 inline-flex items-center gap-0.5">
                Tap to flip back
                <RotateCw size={9} />
              </p>
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Quick Check — tap answer, animated feedback
// ============================================================================

function QuickCheckView({ block }: { block: QuickCheck }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion();

  const result = selected !== null ? block.options[selected] : null;

  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 space-y-3">
      <div>
        <p className="text-[10px] text-surface-500 uppercase tracking-wide font-medium mb-1.5">Quick check</p>
        <p className="text-sm text-surface-200 leading-relaxed">{block.prompt_md}</p>
      </div>
      <div className="grid gap-1.5">
        {block.options.map((opt, idx) => {
          const isChosen = selected === idx;
          const showResult = revealed && isChosen;
          return (
            <motion.button
              key={opt.id}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              onClick={() => { setSelected(idx); setRevealed(true); }}
              disabled={revealed && !isChosen}
              className={clsx(
                'p-3 rounded-lg border text-left text-sm transition-colors',
                showResult && opt.is_correct  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
                : showResult && !opt.is_correct ? 'bg-rose-500/15 border-rose-500/40 text-rose-100'
                : isChosen                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-100'
                : 'bg-surface-950/60 border-surface-800 text-surface-200 hover:border-surface-700',
              )}
            >
              <span className="inline-block w-5 text-[10px] uppercase font-bold opacity-70">
                {String.fromCharCode(65 + idx)})
              </span>
              {opt.text}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {revealed && result && (
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 4 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0 }}
            className={clsx(
              'p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2',
              result.is_correct
                ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-100'
                : 'bg-rose-500/5 border-rose-500/30 text-rose-100',
            )}
          >
            {result.is_correct
              ? <CheckCircle size={12} className="shrink-0 mt-0.5" />
              : <XCircle size={12} className="shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="font-medium mb-0.5">{result.is_correct ? 'Correct' : 'Not quite'}</p>
              <p>{result.is_correct ? block.correct_feedback_md : (result.feedback_if_wrong_md || 'Try another option.')}</p>
              {!result.is_correct && (
                <button
                  onClick={() => { setSelected(null); setRevealed(false); }}
                  className="mt-2 text-[10px] underline opacity-80 hover:opacity-100"
                >
                  Try again
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Animated Derivation — lines fade in sequentially, replay button
// ============================================================================

function AnimatedDerivationView({ block }: { block: AnimatedDerivation }) {
  const [playthrough, setPlaythrough] = useState(0);  // forces remount for replay
  const reduce = useReducedMotion();

  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        {block.title && (
          <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">{block.title}</p>
        )}
        <button
          onClick={() => setPlaythrough(p => p + 1)}
          className="text-[10px] text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
        >
          <RotateCw size={9} />
          Replay
        </button>
      </div>
      <div key={playthrough} className="space-y-2">
        {block.lines.map((line, idx) => (
          <motion.div
            key={`${playthrough}:${line.id}`}
            initial={reduce ? {} : { opacity: 0, y: 4 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.4, duration: 0.3 }}
            className="space-y-0.5"
          >
            {idx > 0 && (
              <p className="text-[10px] text-surface-500 italic ml-4">↓ {line.rationale_md}</p>
            )}
            <div className="p-2.5 rounded-lg bg-surface-950 font-mono text-sm text-sky-300 overflow-x-auto">
              {line.latex}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Drag Match — drag left-side items to right-side slots
// ============================================================================

function DragMatchView({ block }: { block: DragMatch }) {
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, 'right' | 'wrong' | null>>({});

  const rightOptions = useMemo(() => {
    const all = [...block.pairs.map(p => p.right), ...(block.right_decoys || [])];
    // Stable shuffle on id
    return [...all].sort((a, b) => a.id.localeCompare(b.id));
  }, [block]);

  const attemptMatch = (leftId: string, rightId: string) => {
    const pair = block.pairs.find(p => p.left.id === leftId);
    const isRight = pair?.right.id === rightId;
    setMatched(m => ({ ...m, [leftId]: rightId }));
    setFeedback(f => ({ ...f, [leftId]: isRight ? 'right' : 'wrong' }));
  };

  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 space-y-3">
      {block.title && (
        <p className="text-[11px] text-surface-400 uppercase tracking-wide font-medium">{block.title}</p>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1.5">
          {block.pairs.map(pair => (
            <div
              key={pair.left.id}
              className={clsx(
                'p-2 rounded-lg border',
                feedback[pair.left.id] === 'right' ? 'bg-emerald-500/10 border-emerald-500/30'
                : feedback[pair.left.id] === 'wrong' ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-surface-950/60 border-surface-800',
              )}
            >
              <p className="text-surface-200">{pair.left.content_md}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {rightOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                // Find first unmatched left and attempt the match
                const nextLeft = block.pairs.find(p => !matched[p.left.id]);
                if (nextLeft) attemptMatch(nextLeft.left.id, opt.id);
              }}
              className="w-full p-2 rounded-lg border border-surface-800 bg-surface-950/60 text-surface-300 hover:border-surface-700 text-left"
            >
              {opt.content_md}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-surface-500">
        Tap the right-side item that matches the next unmatched left-side concept. Full drag-to-match
        available in a future release.
      </p>
    </div>
  );
}
