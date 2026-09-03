/**
 * TheoremWizardPage — method-selection trainer for theorem choice.
 *
 * Route: /theorem-wizard/:module
 *
 * W2.5 / amendment D2: this page used to carry its own hardcoded
 * WIZARD_SPECS object AND its own copy of the step/reveal/progress
 * rendering. Both are gone. The content now lives as data in
 * `@/data/method-selection-trainers` and renders through the shared
 * `guided_walkthrough` renderer — the same component, and the same spec
 * format, that a lesson-embedded ```interactive-spec``` block uses. The
 * page is a shell: header, back link, widget.
 *
 * Nothing was dropped in the move: every prompt, hint and answer the old
 * page showed survives verbatim as the spec's `steps`, and the branching
 * tree turns the same material into a decision the student commits to.
 *
 * Self-check only (E5) — the widget records no marks. The honesty label
 * inside the widget says so.
 *
 * /investigate (2026-09-03): when `PracticeAttemptPage` links here off a
 * wrong answer, it carries `?concept=<node_id>&mistake=<label>` — read via
 * `useSearchParams` and handed to `WizardContextBanner`/`WizardPracticeCTA`
 * (both no-ops when absent, so a directly-visited wizard is unchanged).
 */

import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { GuidedWalkthrough } from '@/components/lesson/interactives/GuidedWalkthrough';
import { THEOREM_WIZARD_TRAINERS } from '@/data/method-selection-trainers';
import { WizardContextBanner, WizardPracticeCTA } from '@/components/app/WizardMistakeLoop';

export default function TheoremWizardPage() {
  const { module: moduleId } = useParams<{ module: string }>();
  const [searchParams] = useSearchParams();
  const concept = searchParams.get('concept');
  const mistakeLabel = searchParams.get('mistake');
  const trainer = THEOREM_WIZARD_TRAINERS[moduleId ?? ''];

  if (!trainer) {
    return (
      <div style={{ padding: 24 }}>
        <Link
          to="/knowledge-home"
          style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-subhead)', textDecoration: 'none' }}
        >
          ← Back
        </Link>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}>
          No theorem wizard available for module "{moduleId}" yet.
        </p>
      </div>
    );
  }

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
        <BookOpen size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} aria-hidden />
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
