/**
 * MarketingLanding — /gbrain
 *
 * Public-facing marketing page explaining GBrain's cognitive architecture
 * and why it's a defensible moat. Designed to convert students and attract
 * investors/partners who want to see the tech depth.
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Target, Zap, Layers, Sparkles, TrendingUp, ArrowRight, GitBranch,
  Microscope, BarChart3, Shield, CheckCircle2,
} from 'lucide-react';
import { StaticSampleProblem } from '@/components/app/StaticSampleProblem';

export default function MarketingLanding() {
  return (
    <div className="-mx-4">
      {/* === HERO === */}
      <section className="relative px-4 pt-8 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-emerald-500/5" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Sparkles size={13} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Daily study plan, calibrated to you</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-surface-100 leading-tight">
            Know exactly the <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">three things</span> to study tomorrow.
          </h1>
          <p className="text-base text-surface-400 leading-relaxed">
            Stop guessing what to revise. Vidhya tells you the three problems that move the needle most for
            your exam, today. Tomorrow it tells you what's next. Every wrong answer makes the next session smarter for you.
            Show up, follow the plan, get better. That's it.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 inline-flex items-center justify-center gap-1.5">
              Start Free — No Card <ArrowRight size={14} />
            </Link>
            <Link to="/mock-exam" className="px-6 py-3 rounded-xl bg-surface-900 border border-surface-800 text-surface-200 text-sm font-semibold">
              Try a Mock Exam
            </Link>
          </div>
        </motion.div>
      </section>

      {/* === TRY ONE ===
          v4.0 P8: Anonymous visitors get to feel the product before
          committing an email. One real GATE problem, instant feedback,
          then sign-up CTA. The first problem > the first page of copy. */}
      <section className="px-4 py-8">
        <StaticSampleProblem />
      </section>

      {/* === STUDENT PROMISE STRIP ===
          v2.5: replaced the architecture-pride strip ("82 concepts mapped, 112
          prereq edges") with a student-outcome strip. The architecture is real
          but it's investor language. Students want to know what they get. */}
      <section className="px-4 py-6 bg-surface-900/50 border-y border-surface-800">
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { value: '3', label: 'tasks per day, not 30' },
            { value: '0', label: 'streak guilt, ever' },
            { value: '∞', label: 'questions, on demand' },
            { value: '1', label: 'plan you actually follow' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl sm:text-2xl font-display font-black text-surface-100">{s.value}</p>
              <p className="text-[10px] text-surface-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === HOW IT WORKS — collapsed by default. v2.5: this is depth-of-craft
            content for builders/investors who want to see what's under the
            hood. Students don't need to read it to start. */}
      <section className="px-4 py-10 max-w-2xl mx-auto">
        <details className="group">
          <summary className="cursor-pointer list-none text-center mb-6">
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-display font-bold text-surface-100 text-center mb-1">
              For builders &amp; the curious — six pillars under the hood <span className="text-violet-400 group-open:rotate-90 inline-block transition-transform">›</span>
            </motion.h2>
            <p className="text-xs text-surface-500">Each layer makes the next one smarter. Click to expand.</p>
          </summary>
        <div className="space-y-3">
          {[
            {
              icon: Brain,
              color: 'text-violet-400 bg-violet-500/10',
              title: '1 — Student Model',
              desc: '15 live attributes updating on every attempt: mastery per concept, speed, cognitive style, motivation, confidence calibration.',
            },
            {
              icon: Microscope,
              color: 'text-amber-400 bg-amber-500/10',
              title: '2 — Error Taxonomy',
              desc: 'Every wrong answer classified into 7 types (conceptual, procedural, notation, misread, time-pressure, arithmetic, overconfidence). Tells you why you got it wrong, not just that you did.',
            },
            {
              icon: GitBranch,
              color: 'text-purple-400 bg-purple-500/10',
              title: '3 — Concept Graph',
              desc: 'Concepts in a prerequisite DAG, per exam. When you miss "chain rule," we trace back to find your actual weakness might be "limits."',
            },
            {
              icon: Sparkles,
              color: 'text-emerald-400 bg-emerald-500/10',
              title: '4 — Adaptive Problem Generation',
              desc: 'Infinite calibrated practice. Targets specific (concept × error type × difficulty) gaps. Self-verified. Zero-latency cache.',
            },
            {
              icon: Target,
              color: 'text-red-400 bg-red-500/10',
              title: '5 — Exam Strategy Optimizer',
              desc: 'Personalized playbook: attempt order (fastest topics first), time budgets, skip threshold calibrated to your confidence-accuracy history.',
            },
            {
              icon: Layers,
              color: 'text-violet-400 bg-violet-500/10',
              title: '6 — Task Reasoner',
              desc: '5-node decision tree runs before every chat message: intent → action → difficulty → format → verification. Never generic advice.',
            },
          ].map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-surface-900 border border-surface-800"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${p.color} shrink-0`}>
                  <p.icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-surface-100 mb-1">{p.title}</h3>
                  <p className="text-xs text-surface-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </details>
      </section>

      {/* === DIFFERENTIATION === */}
      <section className="px-4 py-10 bg-surface-900/30 border-y border-surface-800">
        <div className="max-w-2xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-bold text-surface-100 text-center mb-6">
            Most apps vs GBrain
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-surface-950 border border-surface-800">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Most apps</p>
              <ul className="space-y-2 text-sm text-surface-400">
                <li>• Static question bank (500-2000 problems)</li>
                <li>• "Accuracy: 60%" — tells you nothing</li>
                <li>• Random practice selection</li>
                <li>• Generic "study harder" advice</li>
                <li>• No memory of previous mistakes</li>
                <li>• Identical for every student</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border border-violet-500/25">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-3">GBrain</p>
              <ul className="space-y-2 text-sm text-surface-200">
                <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> Infinite generated + verified problems</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> "Your chain-rule confusion is because limits at 30%"</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> Targets your exact error-type gaps</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> Data-backed attempt order & time budget</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> Every error permanently improves the model</li>
                <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> Personalized to 15 cognitive attributes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURE SHOWCASE === */}
      <section className="px-4 py-10 max-w-2xl mx-auto">
        <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-bold text-surface-100 text-center mb-6">
          What you get
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { to: '/audit', icon: BarChart3, title: 'Student Audit', desc: '360° analysis — mastery heatmap, foundation alerts, 3-session plan' },
            { to: '/digest', icon: Sparkles, title: 'Weekly Digest', desc: 'Tone-calibrated progress report with one concrete action' },
            { to: '/mock-exam', icon: Target, title: 'Mock Exam', desc: 'Full-length timed, calibrated to your mastery' },
            { to: '/exam-strategy', icon: Zap, title: 'Exam Strategy', desc: 'Attempt order, time budget, personalized skip threshold' },
            { to: '/error-patterns', icon: TrendingUp, title: 'Error Patterns', desc: 'Weekly digest of error types with trends and recommendations' },
            { to: '/chat', icon: Brain, title: 'AI Tutor', desc: 'Task Reasoner runs before every response — never generic' },
          ].map((f, i) => (
            <motion.div
              key={f.to}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={f.to} className="block p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-violet-500/30 transition-colors group h-full">
                <f.icon size={16} className="text-violet-400 mb-2" />
                <h3 className="text-sm font-bold text-surface-100 mb-1">{f.title}</h3>
                <p className="text-xs text-surface-400 leading-relaxed">{f.desc}</p>
                <ArrowRight size={12} className="text-surface-600 group-hover:text-violet-400 mt-2 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* === TECH CREDIBILITY === */}
      <section className="px-4 py-10 bg-surface-900/30 border-y border-surface-800">
        <div className="max-w-2xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-bold text-surface-100 text-center mb-6">
            Built on production infrastructure
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: 'Verification', value: '3-tier' },
              { label: 'Answer check', value: 'Wolfram + LLM + RAG' },
              { label: 'Embedding dim', value: '3072' },
              { label: 'Auto-migrate', value: 'Postgres + pgvector' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-surface-950 border border-surface-800">
                <p className="text-xs text-surface-500 mb-1">{s.label}</p>
                <p className="text-sm font-bold text-surface-200">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-surface-950 border border-surface-800">
            <p className="text-xs text-surface-500 mb-2 uppercase tracking-wide">Every problem solved flows through:</p>
            <p className="text-sm text-surface-300 font-mono">
              Task Reasoner → Content Generator → Verification → Error Classifier →
              Student Model Update → Prerequisite Alert Refresh → Exam Strategy Recompute
            </p>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="px-4 py-12 text-center max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
          <h2 className="text-2xl font-black text-surface-100">Start learning with a tutor that actually learns you</h2>
          <p className="text-sm text-surface-400">Free to start. No signup to try a problem.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 text-white font-bold shadow-lg shadow-emerald-500/25"
          >
            Practice Now <ArrowRight size={15} />
          </Link>
        </motion.div>
      </section>

      {/* === FOOTER === */}
      <section className="px-4 py-6 border-t border-surface-800 text-center text-xs text-surface-600">
        <p>GATE Engineering Mathematics · GBrain v2.0</p>
      </section>
    </div>
  );
}
