/**
 * DistributionSelectorPage — E7 Delight Bundle: Distribution-Selection Wizard.
 *
 * Route: /distribution-selector
 * A guided_walkthrough that helps students identify the right probability
 * distribution for a given scenario. Driven by ue_*=theorem_selection entries
 * in the pain-point registry.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sigma } from 'lucide-react';

interface WizardStep {
  id: string;
  scenario: string;
  hint: string;
  answer: string;
}

const STEPS: WizardStep[] = [
  {
    id: 'ds_1',
    scenario:
      'A call centre receives on average 8 calls per hour. You want to find the probability of exactly 5 calls arriving in the next hour. Which distribution do you use?',
    hint: 'The events occur at a known average rate, independently, over a fixed interval of time.',
    answer:
      'Poisson(λ=8). Use the Poisson distribution whenever you count the number of occurrences of an independent event in a fixed interval, given only the mean rate λ. P(X=k) = e^{−λ} λ^k / k!.',
  },
  {
    id: 'ds_2',
    scenario:
      'A factory produces bolts; each bolt independently has a 2% defect probability. A box contains 50 bolts. What is the probability that exactly 3 are defective?',
    hint: 'Fixed n trials, each with the same success probability, independent of one another.',
    answer:
      'Binomial(n=50, p=0.02). The Binomial counts successes in n independent Bernoulli trials with constant probability p. P(X=k) = C(n,k) p^k (1−p)^{n−k}. (Poisson approximation Poisson(1) also works here since n is large and p small, but Binomial is exact.)',
  },
  {
    id: 'ds_3',
    scenario:
      'A survey reports that 30% of voters support a policy. You sample until you find the first supporter. What distribution models the number of people you need to survey?',
    hint: 'You are counting trials until the first success.',
    answer:
      'Geometric(p=0.30). The Geometric distribution models the number of independent Bernoulli trials needed to obtain the first success. P(X=k) = (1−p)^{k−1} p. Mean = 1/p = 3.33 surveys on average.',
  },
  {
    id: 'ds_4',
    scenario:
      'The time (in minutes) until a bus arrives is equally likely to be anywhere between 0 and 15 minutes. What distribution describes the waiting time, and what is its mean?',
    hint: 'Every value in a finite continuous interval is equally probable.',
    answer:
      'Uniform(a=0, b=15). The Continuous Uniform distribution on [a,b] has PDF f(x) = 1/(b−a). Mean = (a+b)/2 = 7.5 min; Var = (b−a)²/12 = 18.75 min².',
  },
  {
    id: 'ds_5',
    scenario:
      'IQ scores in a population have mean 100 and standard deviation 15. What is the probability that a randomly chosen person has IQ > 130?',
    hint: 'The sum of many independent effects; shape is the bell curve.',
    answer:
      'Normal(μ=100, σ=15). Standardise: Z = (130−100)/15 = 2. P(X>130) = P(Z>2) ≈ 0.0228 (from the standard normal table). By the Central Limit Theorem, aggregated continuous measurements cluster around the Normal.',
  },
  {
    id: 'ds_6',
    scenario:
      'A machine part fails after an exponentially distributed lifetime with mean 200 hours. What is the probability it survives past 300 hours?',
    hint: 'Continuous time-to-failure; the only continuous memoryless distribution.',
    answer:
      'Exponential(λ=1/200). P(X>300) = e^{−λt} = e^{−300/200} = e^{−1.5} ≈ 0.223. The memoryless property: the remaining lifetime has the same distribution regardless of how long it has already run.',
  },
];

export default function DistributionSelectorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, 'hint' | 'answer' | null>>({});

  const step = STEPS[currentStep];
  const revealState = revealed[step.id] ?? null;

  function reveal(level: 'hint' | 'answer') {
    setRevealed(prev => ({ ...prev, [step.id]: level }));
  }

  function next() {
    if (currentStep < STEPS.length - 1) setCurrentStep(i => i + 1);
  }

  function prev() {
    if (currentStep > 0) setCurrentStep(i => i - 1);
  }

  const done = currentStep === STEPS.length - 1 && revealState === 'answer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}>
      <Link
        to="/knowledge-home"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={13} /> Back
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sigma size={20} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Which Probability Distribution?
        </h1>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
        Read each scenario and identify the right distribution before revealing the answer.
      </p>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--indigo)' : 'var(--surface-fill)',
              border: 'var(--hairline) solid var(--separator)',
            }}
          />
        ))}
      </div>

      {/* Step card */}
      <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', fontWeight: 'var(--weight-medium)' }}>
          {step.scenario}
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => reveal('hint')}
            disabled={revealState !== null}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: revealState !== null ? 'var(--surface-fill)' : 'var(--indigo)',
              border: 'none',
              color: revealState !== null ? 'var(--text-tertiary)' : '#fff',
              fontSize: 'var(--text-caption)',
              fontFamily: 'var(--font-sans)',
              cursor: revealState !== null ? 'default' : 'pointer',
            }}
          >
            Show hint
          </button>
          <button
            onClick={() => reveal('answer')}
            disabled={revealState === 'answer'}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: revealState === 'answer' ? 'var(--surface-fill)' : 'var(--green)',
              border: 'none',
              color: revealState === 'answer' ? 'var(--text-tertiary)' : '#fff',
              fontSize: 'var(--text-caption)',
              fontFamily: 'var(--font-sans)',
              cursor: revealState === 'answer' ? 'default' : 'pointer',
            }}
          >
            Show answer
          </button>
        </div>

        {revealState === 'hint' && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(88,86,214,.06)', border: '1px solid rgba(88,86,214,.18)', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)', lineHeight: 'var(--leading-relaxed)' }}>
            <strong>Hint:</strong> {step.hint}
          </div>
        )}

        {revealState === 'answer' && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', fontSize: 'var(--text-caption)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)' }}>
            <strong style={{ color: 'var(--green-ink)' }}>Answer:</strong> {step.answer}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={prev}
          disabled={currentStep === 0}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
        >
          ← Previous
        </button>

        <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
          {currentStep + 1} / {STEPS.length}
        </span>

        {!done ? (
          <button
            onClick={next}
            disabled={currentStep === STEPS.length - 1}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: currentStep < STEPS.length - 1 ? 'var(--indigo)' : 'var(--surface-fill)', border: 'none', color: currentStep < STEPS.length - 1 ? '#fff' : 'var(--text-tertiary)', fontSize: 'var(--text-caption)', cursor: currentStep < STEPS.length - 1 ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)' }}
          >
            Next →
          </button>
        ) : (
          <Link
            to="/knowledge-home"
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--green)', color: '#fff', textDecoration: 'none', fontSize: 'var(--text-caption)', fontFamily: 'var(--font-sans)' }}
          >
            Done ✓
          </Link>
        )}
      </div>
    </div>
  );
}
