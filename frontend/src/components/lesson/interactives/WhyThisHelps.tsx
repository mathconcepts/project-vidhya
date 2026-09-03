/**
 * WhyThisHelps.tsx
 *
 * Shared framing line rendered above every interactive widget
 * (InteractiveSidecar) and above ConceptMathViz — the "why is this here"
 * gap from live-QA (2026-09-03): students met a slider or a "Try It" block
 * with zero explanation of what it was for or why it mattered, right next
 * to the exam content they came for.
 *
 * One component, one visual treatment, everywhere a widget needs framing —
 * so the fix reaches every existing and future interactive without a
 * second copy of the styling rules. Renders nothing when `why` is absent
 * (an unauthored widget stays exactly as before) or when the student has
 * turned framing off via useEliFraming.
 */

import { MarkdownAtomRenderer } from '../MarkdownAtomRenderer';
import { useEliFraming } from '@/hooks/useEliFraming';

interface Props {
  why?: string;
  /** Unique-enough id for the MarkdownAtomRenderer atomId prop (KaTeX cache key). */
  idHint: string;
}

export function WhyThisHelps({ why, idHint }: Props) {
  const [framingEnabled, , toggle] = useEliFraming();

  if (!why || !framingEnabled) return null;

  return (
    <div
      className="flex items-start justify-between gap-3"
      style={{ marginBottom: 8 }}
    >
      <div className="flex-1 min-w-0" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
        <MarkdownAtomRenderer content={why} atomId={`${idHint}.why`} className="vidhya-atom-body--hint-neutral" />
      </div>
      <button
        type="button"
        onClick={toggle}
        className="flex-shrink-0"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--text-footnote)',
          color: 'var(--text-tertiary)',
          textDecoration: 'underline',
          padding: 0,
        }}
        aria-label="Hide these why-this-helps tips"
      >
        Hide these tips
      </button>
    </div>
  );
}
