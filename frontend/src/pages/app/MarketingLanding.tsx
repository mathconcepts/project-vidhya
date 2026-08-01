/**
 * MarketingLanding — /gbrain
 *
 * Public-facing marketing page explaining GBrain's cognitive architecture
 * and why it's a defensible moat.
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Target, Zap, Layers, Sparkles, TrendingUp, ArrowRight, GitBranch,
  Microscope, BarChart3, CheckCircle2,
} from 'lucide-react';
import { StaticSampleProblem } from '@/components/app/StaticSampleProblem';
import { trackPageView } from '@/lib/beacon';

const PILLARS = [
  {
    icon: Brain,
    color: 'var(--indigo-ink)',
    title: '1 — Student Model',
    desc: '15 live attributes updating on every attempt: mastery per concept, speed, cognitive style, motivation, confidence calibration.',
  },
  {
    icon: Microscope,
    color: 'var(--orange)',
    title: '2 — Error Taxonomy',
    desc: 'Every wrong answer classified into 7 types. Tells you why you got it wrong, not just that you did.',
  },
  {
    icon: GitBranch,
    color: 'var(--indigo-ink)',
    title: '3 — Concept Graph',
    desc: 'Concepts in a prerequisite DAG. When you miss "chain rule," we trace back to find your actual weakness.',
  },
  {
    icon: Sparkles,
    color: 'var(--green-ink)',
    title: '4 — Adaptive Problem Generation',
    desc: 'Infinite calibrated practice. Targets specific (concept × error type × difficulty) gaps. Self-verified.',
  },
  {
    icon: Target,
    color: 'var(--red)',
    title: '5 — Exam Strategy Optimizer',
    desc: 'Personalized playbook: attempt order, time budgets, skip threshold calibrated to your history.',
  },
  {
    icon: Layers,
    color: 'var(--indigo-ink)',
    title: '6 — Task Reasoner',
    desc: '5-node decision tree runs before every chat message. Never generic advice.',
  },
];

const FEATURES = [
  { to: '/audit',         icon: BarChart3,  title: 'Student Audit',    desc: '360° analysis — mastery heatmap, foundation alerts, 3-session plan' },
  { to: '/digest',        icon: Sparkles,   title: 'Weekly Digest',    desc: 'Tone-calibrated progress report with one concrete action' },
  { to: '/mock-exam',     icon: Target,     title: 'Mock Exam',        desc: 'Full-length timed, calibrated to your mastery' },
  { to: '/exam-strategy', icon: Zap,        title: 'Exam Strategy',    desc: 'Attempt order, time budget, personalized skip threshold' },
  { to: '/error-patterns',icon: TrendingUp, title: 'Error Patterns',   desc: 'Weekly digest of error types with trends and recommendations' },
  { to: '/chat',          icon: Brain,      title: 'AI Tutor',         desc: 'Task Reasoner runs before every response — never generic' },
];

const GBRAIN_CHECKS = [
  'Infinite generated + verified problems',
  'Your chain-rule confusion is because limits at 30%',
  'Targets your exact error-type gaps',
  'Data-backed attempt order & time budget',
  'Every error permanently improves the model',
  'Personalized to 15 cognitive attributes',
];

export default function MarketingLanding() {
  const mountedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());

  useEffect(() => {
    const msToContent = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - mountedAt.current,
    );
    trackPageView('/gbrain', msToContent);
  }, []);

  return (
    <div style={{ margin: '0 -16px' }}>
      {/* HERO */}
      <section style={{ padding: '32px 16px 48px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 'var(--radius-capsule)',
          background: 'rgba(88,86,214,.08)',
          border: '1px solid rgba(88,86,214,.2)',
          marginBottom: 20,
        }}>
          <Sparkles size={13} style={{ color: 'var(--indigo-ink)' }} />
          <span style={{ fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--indigo-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily study plan, calibrated to you
          </span>
        </div>
        <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          The most marks achievable in your hours — honestly stated.
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Learn it, practice it, prove it in mocks, keep it until exam day — every answer machine-verified.
          No inflated promises. Just an honest read on where you stand, and the next thing that moves it.
        </p>
        <Link
          to="/diagnostic"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '14px 24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--green)',
            color: '#fff',
            fontSize: 'var(--text-footnote)',
            fontWeight: 'var(--weight-semibold)',
            textDecoration: 'none',
          }}
        >
          Take the 10-question diagnostic — no signup <ArrowRight size={14} />
        </Link>
      </section>

      {/* TRY ONE */}
      <section style={{ padding: '0 16px 32px' }}>
        <StaticSampleProblem />
      </section>

      {/* STUDENT PROMISE STRIP */}
      <section style={{ padding: '24px 16px', background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          {[
            { value: '3', label: 'tasks per day, not 30' },
            { value: '0', label: 'streak guilt, ever' },
            { value: '∞', label: 'questions, on demand' },
            { value: '1', label: 'plan you actually follow' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '40px 16px', maxWidth: 640, margin: '0 auto' }}>
        <details>
          <summary style={{ cursor: 'pointer', listStyle: 'none', textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.016em' }}>
              For builders &amp; the curious — six pillars under the hood ›
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Each layer makes the next one smarter. Click to expand.</p>
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PILLARS.map((p, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-xs)', background: 'var(--surface-fill)', flexShrink: 0 }}>
                  <p.icon size={16} style={{ color: p.color }} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* DIFFERENTIATION */}
      <section style={{ padding: '40px 16px', background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.016em' }}>
            Most apps vs GBrain
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Most apps
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Fixed static problem set (500–2000)',
                  '"Accuracy: 60%" — tells you nothing',
                  'Random practice selection',
                  'Generic "study harder" advice',
                  'No memory of previous mistakes',
                  'Identical for every student',
                ].map((item, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>· {item}</p>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.2)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 'var(--text-caption2)', fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GBrain
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {GBRAIN_CHECKS.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SHOWCASE */}
      <section style={{ padding: '40px 16px', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.016em' }}>
          What you get
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {FEATURES.map(f => (
            <Link
              key={f.to}
              to={f.to}
              style={{
                display: 'block',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                boxShadow: 'var(--shadow-raise)',
                textDecoration: 'none',
              }}
            >
              <f.icon size={16} style={{ color: 'var(--indigo-ink)', marginBottom: 8 }} />
              <p style={{ margin: '0 0 4px', fontSize: 'var(--text-footnote)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{f.title}</p>
              <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{f.desc}</p>
              <ArrowRight size={12} style={{ color: 'var(--text-tertiary)' }} />
            </Link>
          ))}
        </div>
      </section>

      {/* TECH CREDIBILITY */}
      <section style={{ padding: '40px 16px', background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.016em' }}>
            Built on production infrastructure
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Verification', value: '3-tier' },
              { label: 'Answer check', value: 'Wolfram + LLM + RAG' },
              { label: 'Embedding dim', value: '3072' },
              { label: 'Auto-migrate', value: 'Postgres + pgvector' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 2px', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-raise)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Every problem solved flows through:</p>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: 'var(--leading-normal)' }}>
              Task Reasoner → Content Generator → Verification → Error Classifier →
              Student Model Update → Prerequisite Alert Refresh → Exam Strategy Recompute
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '48px 16px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: '-0.018em' }}>
          See exactly where you stand, in under 10 minutes
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)' }}>No signup required to take the diagnostic.</p>
        <Link
          to="/diagnostic"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '14px 32px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--green)',
            color: '#fff',
            fontSize: 'var(--text-body)',
            fontWeight: 'var(--weight-semibold)',
            textDecoration: 'none',
          }}
        >
          Take the 10-question diagnostic <ArrowRight size={15} />
        </Link>
      </section>

      {/* FOOTER */}
      <section style={{ padding: '20px 16px', borderTop: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
          GATE Engineering Mathematics · GBrain v2.0
        </p>
      </section>
    </div>
  );
}
