/**
 * WizardMistakeLoop.tsx
 *
 * Closes two gaps /investigate found (2026-09-03) in the method-selection
 * wizards (/theorem-wizard/:module, /distribution-selector):
 *
 * 1. "the walkthrough decision tree ... must help them connect to the
 *    concept in the problem" — a student arriving from a wrong practice
 *    answer landed on a wizard that never said WHY it was showing up, or
 *    which of their answers sent them there. `WizardContextBanner` names
 *    the concept (and, when the server diagnosed one, the specific
 *    mistake) so the tree reads as a direct response to what just
 *    happened, not a disconnected generic tool.
 * 2. "reimagine the decision tree ... as identifying your mistakes and
 *    correcting them, adding more practice problems if needed" —
 *    `WizardPracticeCTA` gives the student a direct route into more
 *    practice on the SAME concept, closing the loop the way an actual
 *    tutor would: work out the right method, then go try it.
 *
 * `WizardPracticeCTA` is deliberately NOT gated on "the student reached a
 * leaf" — `DecisionTreeWalkthrough` has an explicit, tested architectural
 * boundary (DecisionTreeWalkthrough.test.tsx: "A future onLeaf/onGraded
 * prop would be the hole E5 closes") against exposing ANY leaf-visibility
 * callback, even a non-grading one, because the leaf's `best` flag is
 * client-visible and a future caller could be tempted to report it as a
 * correctness signal — reopening the client-trusted-grading hole the
 * mock-exam fix closed. Respecting that boundary means this component
 * cannot know whether a leaf was reached, so the CTA is simply always
 * available once there is a concept to practice — an honest "when you're
 * ready" escape hatch rather than a gated "you're done" reward.
 *
 * Both components are silent (render nothing) when there is no `concept`
 * context — a wizard opened directly, with no practice attempt behind it,
 * renders exactly as it did before this change.
 */

import { Link } from 'react-router-dom';
import { Repeat } from 'lucide-react';

/**
 * `concept` is a slug (`item.node_id` from the practice item, e.g.
 * "rank-nullity") — displayed with hyphens turned to spaces, the same
 * lightweight convention already used for topic/relationship labels
 * elsewhere (LessonPage.tsx and others), never a fabricated proper title.
 */
export function WizardContextBanner({
  concept,
  mistakeLabel,
}: {
  concept: string | null;
  mistakeLabel: string | null;
}) {
  if (!concept) return null;
  const conceptLabel = concept.replace(/-/g, ' ');
  return (
    <p
      style={{
        margin: 0,
        fontSize: 'var(--text-subhead)',
        color: 'var(--text-secondary)',
        lineHeight: 1.45,
      }}
    >
      You got a <strong style={{ color: 'var(--text-primary)' }}>{conceptLabel}</strong> question
      wrong{mistakeLabel ? ` — ${mistakeLabel}` : ''}. Work through the questions below to find
      where the mix-up happened.
    </p>
  );
}

export function WizardPracticeCTA({ concept }: { concept: string | null }) {
  if (!concept) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: 0, fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
        When you're ready, put it into practice.
      </p>
      <Link
        to={`/smart-practice?concept=${encodeURIComponent(concept)}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--green)',
          color: 'var(--text-on-accent)',
          fontSize: 'var(--text-body)',
          fontWeight: 'var(--weight-semibold)',
          textDecoration: 'none',
          alignSelf: 'flex-start',
        }}
      >
        <Repeat size={14} aria-hidden /> Practice more like this
      </Link>
    </div>
  );
}
