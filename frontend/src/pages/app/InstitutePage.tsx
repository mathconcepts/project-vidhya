/**
 * InstitutePage — /institute ("Bring your batch")
 *
 * Demand-test one-pager for GATE coaching institutes / teachers (backlog
 * U1-10). Pitches what Vidhya actually does today for a teacher's batch —
 * no invented capabilities. Ends in a lead-capture form (POST /api/interest,
 * kind='institute_batch') so a real conversation can follow.
 *
 * Design: reuses MarketingLanding.tsx's motion/section conventions and the
 * DESIGN-SYSTEM.md palette (navy/emerald/violet, Fraunces + DM Sans).
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
    <div className="-mx-4">
      {/* === HERO === */}
      <section className="relative px-4 pt-8 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-2xl mx-auto text-center space-y-5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Users size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">For institutes &amp; teachers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-surface-100 leading-tight">
            Bring your batch to Vidhya
          </h1>
          <p className="text-base text-surface-400 leading-relaxed">
            Your students get a verified AI tutor and adaptive practice. You get a live view into
            who's mastering what — without building or maintaining any of it yourself.
          </p>
          <a
            href="#interest-form"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25"
          >
            Register interest for your batch <ArrowRight size={14} />
          </a>
          <p className="text-xs text-surface-600">
            This is an early conversation, not a signed-up product — see "what exists today" below.
          </p>
        </motion.div>
      </section>

      {/* === WHAT EXISTS TODAY === */}
      <section className="px-4 py-8 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl font-bold text-surface-100 text-center mb-2"
        >
          What's live today
        </motion.h2>
        <p className="text-xs text-surface-500 text-center mb-6">
          Every item below is a real, working feature in Vidhya — not a roadmap slide.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              icon: Brain,
              color: 'text-violet-400 bg-violet-500/10',
              title: 'AI tutor, always on',
              desc: 'Streaming chat tutor (Gemini 2.5-flash) your students can ask anything, any time — no waiting for a doubt-clearing slot.',
            },
            {
              icon: ShieldCheck,
              color: 'text-emerald-400 bg-emerald-500/10',
              title: 'Machine-verified answers',
              desc: 'Every answer runs through a 3-tier check (cached solutions → dual LLM solve → Wolfram Alpha) before it reaches a student.',
            },
            {
              icon: ClipboardCheck,
              color: 'text-emerald-400 bg-emerald-500/10',
              title: 'Adaptive daily practice',
              desc: 'Spaced-repetition scheduling plus a daily study plan that tells each student what to work on next — not a static problem bank.',
            },
            {
              icon: BarChart3,
              color: 'text-emerald-400 bg-emerald-500/10',
              title: 'Teacher roster dashboard',
              desc: 'A per-teacher view of every linked student’s mastery, and who needs attention right now — real, live, already shipped.',
            },
            {
              icon: BookOpen,
              color: 'text-emerald-400 bg-emerald-500/10',
              title: 'Weekly teacher brief + syllabus coverage',
              desc: 'A weekly digest of your cohort’s progress, plus a coverage view of which syllabus topics your batch has and hasn’t touched.',
            },
            {
              icon: Smartphone,
              color: 'text-emerald-400 bg-emerald-500/10',
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
              className="p-4 rounded-xl bg-surface-900 border border-surface-800"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${f.color} shrink-0`}>
                  <f.icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-surface-100 mb-1">{f.title}</h3>
                  <p className="text-xs text-surface-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* === HOW A BATCH GETS SET UP (honest, not oversold) === */}
      <section className="px-4 py-8 bg-surface-900/40 border-y border-surface-800">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-bold text-surface-100 text-center mb-6"
          >
            How this works today
          </motion.h2>
          <ol className="space-y-3 text-sm text-surface-300">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
              Your students sign up and start practicing on Vidhya — free, no institute setup required.
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
              We link each student to your teacher account by hand for now (this is manual, on purpose — no self-serve bulk import yet).
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
              You get the roster dashboard, weekly brief, and syllabus coverage view for your batch — automatically, from that point on.
            </li>
          </ol>
        </div>
      </section>

      {/* === WHAT'S NOT HERE YET (honesty section) === */}
      <section className="px-4 py-8 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-lg font-bold text-surface-100 text-center mb-4"
        >
          What's not built yet
        </motion.h2>
        <div className="p-4 rounded-xl bg-surface-950 border border-surface-800">
          <ul className="space-y-2 text-sm text-surface-400">
            <li className="flex gap-2"><XCircle size={14} className="text-surface-600 shrink-0 mt-0.5" /> Self-serve bulk roster upload (CSV / LMS sync)</li>
            <li className="flex gap-2"><XCircle size={14} className="text-surface-600 shrink-0 mt-0.5" /> Institute billing, seats, or paid plans of any kind</li>
            <li className="flex gap-2"><XCircle size={14} className="text-surface-600 shrink-0 mt-0.5" /> Selling your own course content through Vidhya — <Link to="/sell-your-course" className="text-emerald-400 underline">that's a separate idea we're testing demand for</Link></li>
          </ul>
        </div>
      </section>

      {/* === FORM === */}
      <section id="interest-form" className="px-4 py-10 max-w-2xl mx-auto scroll-mt-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-5 sm:p-6 rounded-2xl bg-surface-900 border border-surface-800"
        >
          <h2 className="text-lg font-bold text-surface-100 mb-1">Bring your batch — register interest</h2>
          <p className="text-xs text-surface-500 mb-5">
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
      <section className="px-4 py-6 border-t border-surface-800 text-center text-xs text-surface-600">
        <p>Vidhya for institutes · a demand-test page, not a sales page for something that doesn't exist</p>
      </section>
    </div>
  );
}
