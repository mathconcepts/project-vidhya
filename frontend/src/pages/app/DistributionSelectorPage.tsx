/**
 * DistributionSelectorPage — method-selection trainer for distribution choice.
 *
 * Route: /distribution-selector
 *
 * W2.5 / amendment D2: the six hardcoded STEPS and the bespoke
 * reveal/progress rendering that used to live here are gone. The content
 * is data in `@/data/method-selection-trainers` and renders through the
 * shared `guided_walkthrough` renderer — the same path a lesson-embedded
 * ```interactive-spec``` block takes.
 *
 * All six original scenarios survive verbatim as the spec's `steps`; the
 * branching tree turns them into a classify-then-commit decision, with
 * every plausible wrong distribution walkable to a leaf that says why it
 * fails.
 *
 * Self-check only (E5) — no marks are recorded.
 *
 * /investigate (2026-09-03): same `?concept=&mistake=` context + practice
 * loop as TheoremWizardPage — see WizardMistakeLoop.tsx's doc comment.
 */

import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sigma } from 'lucide-react';
import { GuidedWalkthrough } from '@/components/lesson/interactives/GuidedWalkthrough';
import { DISTRIBUTION_TRAINER } from '@/data/method-selection-trainers';
import { WizardContextBanner, WizardPracticeCTA } from '@/components/app/WizardMistakeLoop';

export default function DistributionSelectorPage() {
  const trainer = DISTRIBUTION_TRAINER;
  const [searchParams] = useSearchParams();
  const concept = searchParams.get('concept');
  const mistakeLabel = searchParams.get('mistake');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}>
      <Link
        to="/knowledge-home"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--text-subhead)',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sigma size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} aria-hidden />
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--text-title2)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          {trainer.title}
        </h1>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
        {trainer.description}
      </p>

      <WizardContextBanner concept={concept} mistakeLabel={mistakeLabel} />

      <GuidedWalkthrough spec={trainer.spec} />

      <WizardPracticeCTA concept={concept} />
    </div>
  );
}
