/**
 * TheoremWizardPage — E7 Delight Bundle: Theorem-Selection Wizard.
 *
 * Route: /theorem-wizard/:module
 * A guided_walkthrough that helps students pick the right theorem for a
 * problem class. Driven by ue_*=theorem_selection entries.
 *
 * Uses the existing GuidedWalkthrough component. The specs are seeded
 * from vector-calculus and linear-algebra ue_* theorem-selection entries.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface WizardStep {
  id: string;
  prompt: string;
  hint: string;
  answer: string;
}

interface WizardSpec {
  title: string;
  description: string;
  steps: WizardStep[];
}

const WIZARD_SPECS: Record<string, WizardSpec> = {
  'linear-algebra': {
    title: 'Which Linear Algebra Theorem Applies?',
    description: 'Work through the decision tree to identify the right theorem for your problem.',
    steps: [
      {
        id: 'la_w1',
        prompt: 'You have a square matrix A and need to know if it is invertible. What single number tells you immediately?',
        hint: 'This number is zero when the rows are linearly dependent.',
        answer: 'det(A). If det(A) ≠ 0, A is invertible. If det(A) = 0, A is singular (not invertible). This follows directly from the definition of the determinant and the invertibility equivalence theorem.',
      },
      {
        id: 'la_w2',
        prompt: 'You need to prove that a linear map T: ℝⁿ → ℝⁿ is injective. Which dimension count is the key witness?',
        hint: 'Injective ⟺ the null space contains only the zero vector.',
        answer: 'nullity(T) = 0, i.e. the null space is {0}. By the Rank-Nullity Theorem, rank(T) = n − nullity(T) = n, so the map is also surjective — injective and surjective square maps are equivalent.',
      },
      {
        id: 'la_w3',
        prompt: 'You need to compute A¹⁰⁰ efficiently. What structure of A enables this?',
        hint: 'Write A in a basis where the matrix is diagonal.',
        answer: 'If A is diagonalisable: A = PDP⁻¹, then Aⁿ = PDⁿP⁻¹. Computing Dⁿ is trivial — raise each diagonal entry to the nth power. If A is not diagonalisable, use Cayley-Hamilton to reduce high powers modulo the characteristic polynomial.',
      },
      {
        id: 'la_w4',
        prompt: 'A symmetric matrix appears in a quadratic form xᵀAx. What do the eigenvalues tell you about the definiteness?',
        hint: 'Positive-definiteness means xᵀAx > 0 for all x ≠ 0.',
        answer: 'All eigenvalues > 0 → positive definite. All ≥ 0 → positive semi-definite. All < 0 → negative definite. Mixed signs → indefinite. The Spectral Theorem guarantees real eigenvalues and orthonormal eigenvectors for symmetric A, so the sign of eigenvalues is well-defined.',
      },
    ],
  },
  'vector-calculus': {
    title: 'Which Vector Calculus Theorem Applies?',
    description: 'Identify the right integral theorem for your boundary/surface problem.',
    steps: [
      {
        id: 'vc_w1',
        prompt: 'You have a line integral ∮_C F·dr around a closed curve in 2-D and F is a vector field. Which theorem converts this to a double integral?',
        hint: 'Named after a British mathematician; relates circulation to the 2-D curl.',
        answer: "Green's Theorem: ∮_C F·dr = ∬_D (∂Q/∂x − ∂P/∂y) dA. Use it when the curve is closed, simple, and the region D is well-defined. F = (P, Q) must have continuous partial derivatives on D.",
      },
      {
        id: 'vc_w2',
        prompt: 'You have a surface integral ∬_S (curl F)·dS. Which theorem reduces it to a line integral around the boundary ∂S?',
        hint: 'This is the 3-D generalisation of Green\'s Theorem.',
        answer: "Stokes' Theorem: ∬_S (curl F)·dS = ∮_{∂S} F·dr. The surface S must be orientable and smooth; the boundary curve ∂S must have the orientation induced by S's normal (right-hand rule).",
      },
      {
        id: 'vc_w3',
        prompt: 'You need to compute the outward flux ∬_S F·dS over a closed surface S. Which theorem converts this to a triple integral?',
        hint: 'Also called the Gauss Divergence Theorem.',
        answer: 'The Divergence Theorem: ∬_S F·dS = ∭_V (div F) dV. Use when S is the closed boundary of a solid region V and F has continuous partial derivatives on V. Check that div F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z is simpler than the surface integral.',
      },
    ],
  },
};

export default function TheoremWizardPage() {
  const { module: moduleId } = useParams<{ module: string }>();
  const spec = WIZARD_SPECS[moduleId ?? ''];

  const [currentStep, setCurrentStep] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, 'hint' | 'answer' | null>>({});

  if (!spec) {
    return (
      <div style={{ padding: 24 }}>
        <Link to="/knowledge-home" style={{ color: 'var(--indigo-ink)', fontSize: 'var(--text-caption)', textDecoration: 'none' }}>
          ← Back
        </Link>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>
          No theorem wizard available for module "{moduleId}" yet.
        </p>
      </div>
    );
  }

  const step = spec.steps[currentStep];
  const revealState = revealed[step.id] ?? null;

  function reveal(level: 'hint' | 'answer') {
    setRevealed(prev => ({ ...prev, [step.id]: level }));
  }

  function next() {
    if (currentStep < spec.steps.length - 1) {
      setCurrentStep(i => i + 1);
    }
  }

  function prev() {
    if (currentStep > 0) setCurrentStep(i => i - 1);
  }

  const done = currentStep === spec.steps.length - 1 && revealState === 'answer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}>
      <Link
        to="/knowledge-home"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={13} /> Back
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BookOpen size={20} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 'var(--text-title2)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          {spec.title}
        </h1>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{spec.description}</p>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6 }}>
        {spec.steps.map((s, i) => (
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
          {step.prompt}
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
          {currentStep + 1} / {spec.steps.length}
        </span>

        {!done ? (
          <button
            onClick={next}
            disabled={currentStep === spec.steps.length - 1}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: currentStep < spec.steps.length - 1 ? 'var(--indigo)' : 'var(--surface-fill)', border: 'none', color: currentStep < spec.steps.length - 1 ? '#fff' : 'var(--text-tertiary)', fontSize: 'var(--text-caption)', cursor: currentStep < spec.steps.length - 1 ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)' }}
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
