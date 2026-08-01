/**
 * InstitutePage — /institute ("Bring your batch")
 *
 * Demand-test one-pager for GATE coaching institutes / teachers (backlog
 * U1-10). Pitches what Vidhya actually does today for a teacher's batch —
 * no invented capabilities. Ends in a lead-capture form (POST /api/interest,
 * kind='institute_batch') so a real conversation can follow.
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Users, ClipboardCheck, BarChart3, XCircle,
  ArrowRight, Smartphone, ShieldCheck, BookOpen,
} from 'lucide-react';
import { InterestForm } from '@/components/app/InterestForm';
import { trackPageView } from '@/lib/beacon';

export default function InstitutePage() {
  const mountedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());

  useEffect(() => {
    const msToContent = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - mountedAt.current,
    );
    trackPageView('/institute', msToContent);
  }, []);

  return (
    <div style={{ margin: '0 -16px' }}>
      {/* === HERO === */}
      <section style={{ padding: '32px 16px 40px', overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(52,199,89,.08)', border: '1px solid rgba(52,199,89,.22)' }}>
            <Users size={13} style={{ color: 'var(--green-ink)' }} />
            <span style={{ fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>For institutes &amp; teachers</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Bring your batch to Vidhya
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your students get a verified AI tutor and adaptive practice. You get a live view into
            who's mastering what — without building or maintaining any of it yourself.
          </p>
          <div>
            <a
              href="#interest-form"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 24px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', textDecoration: 'none' }}
            >
              Register interest for your batch <ArrowRight size={14} />
            </a>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            This is an early conversation, not a signed-up product — see "what exists today" below.
          </p>
        </motion.div>
      </section>

      {/* === WHAT EXISTS TODAY === */}
      <section style={{ padding: '32px 16px', maxWidth: 672, margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center' }}
        >
          What's live today
        </motion.h2>
        <p style={{ margin: '0 0 24px', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Every item below is a real, working feature in Vidhya — not a roadmap slide.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            {
              icon: Brain,
              iconBg: 'rgba(88,86,214,.08)',
              iconColor: 'var(--indigo-ink)',
              title: 'AI tutor, always on',
              desc: 'Streaming chat tutor (Gemini 2.5-flash) your students can ask anything, any time — no waiting for a doubt-clearing slot.',
            },
            {
              icon: ShieldCheck,
              iconBg: 'rgba(52,199,89,.08)',
              iconColor: 'var(--green-ink)',
              title: 'Machine-verified answers',
              desc: 'Every answer runs through a 3-tier check (cached solutions → dual LLM solve → Wolfram Alpha) before it reaches a student.',
            },
            {
              icon: ClipboardCheck,
              iconBg: 'rgba(52,199,89,.08)',
              iconColor: 'var(--green-ink)',
              title: 'Adaptive daily practice',
              desc: 'Spaced-repetition scheduling plus a daily study plan that tells each student what to work on next — not a static problem bank.',
            },
            {
              icon: BarChart3,
              iconBg: 'rgba(52,199,89,.08)',
              iconColor: 'var(--green-ink)',
              title: 'Teacher roster dashboard',
              desc: 'A per-teacher view of every linked student's mastery, and who needs attention right now — real, live, already shipped.',
            },
            {
              icon: BookOpen,
              iconBg: 'rgba(52,199,89,.08)',
              iconColor: 'var(--green-ink)',
              title: 'Weekly teacher brief + syllabus coverage',
              desc: 'A weekly digest of your cohort's progress, plus a coverage view of which syllabus topics your batch has and hasn't touched.',
            },
            {
              icon: Smartphone,
              iconBg: 'rgba(52,199,89,.08)',
              iconColor: 'var(--green-ink)',
              title: 'Mobile-first, exam-agnostic core',
              desc: 'Built to work on a phone late at night. GATE Engineering Mathematics is the flagship exam pack today, with BITSAT and JEE Main packs in progress.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: f.iconBg, flexShrink: 0 }}>
                  <f.icon size={16} style={{ color: f.iconColor }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* === HOW A BATCH GETS SET UP === */}
      <section style={{ padding: '32px 16px', background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ maxWidth: 672, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center' }}
          >
            How this works today
          </motion.h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Your students sign up and start practicing on Vidhya — free, no institute setup required.',
              'We link each student to your teacher account by hand for now (this is manual, on purpose — no self-serve bulk import yet).',
              'You get the roster dashboard, weekly brief, and syllabus coverage view for your batch — automatically, from that point on.',
            ].map((text, idx) => (
              <li key={idx} style={{ display: 'flex', gap: 12, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,199,89,.1)', color: 'var(--green-ink)', fontSize: 11, fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                {text}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* === WHAT'S NOT HERE YET === */}
      <section style={{ padding: '32px 16px', maxWidth: 672, margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center' }}
        >
          What's not built yet
        </motion.h2>
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li style={{ display: 'flex', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              <XCircle size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} /> Self-serve bulk roster upload (CSV / LMS sync)
            </li>
            <li style={{ display: 'flex', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              <XCircle size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} /> Institute billing, seats, or paid plans of any kind
            </li>
            <li style={{ display: 'flex', gap: 8, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              <XCircle size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} /> Selling your own course content through Vidhya — <Link to="/sell-your-course" style={{ color: 'var(--green-ink)' }}>that's a separate idea we're testing demand for</Link>
            </li>
          </ul>
        </div>
      </section>

      {/* === FORM === */}
      <section id="interest-form" style={{ padding: '40px 16px', maxWidth: 672, margin: '0 auto', scrollMarginTop: 64 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
        >
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Bring your batch — register interest</h2>
          <p style={{ margin: '0 0 20px', fontSize: 11, color: 'var(--text-tertiary)' }}>
            Tell us about your institute or batch. We'll reach out to talk through a fit — this doesn't create an account or start anything automatically.
          </p>
          <InterestForm
            kind="institute_batch"
            sourcePage="/institute"
            messagePlaceholder="How many students? Which exam(s)? Anything you need that's not listed above?"
            submitLabel="Register interest for my batch"
          />
        </motion.div>
      </section>

      {/* === FOOTER === */}
      <section style={{ padding: '24px 16px', borderTop: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Vidhya for institutes · a demand-test page, not a sales page for something that doesn't exist</p>
      </section>
    </div>
  );
}
