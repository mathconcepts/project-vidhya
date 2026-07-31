/**
 * SellYourCoursePage — /sell-your-course
 *
 * Ethical fake-door demand test (backlog U1-10). Describes a hypothetical
 * future capability — institutes/teachers selling their own course content
 * through Vidhya — that is explicitly NOT built. This page exists only to
 * measure interest; it must never imply the feature is live or that
 * clicking through starts a real transaction.
 *
 * Vidhya's #1 design law is "labels never lie." Every element on this page
 * is labeled as a concept under consideration, not a product: "Coming
 * soon", "not built yet", "register interest" (never "buy", "sign up",
 * "get started", or a price anyone could mistake for a real charge).
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Store, Sparkles, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';
import { InterestForm } from '@/components/app/InterestForm';
import { trackPageView } from '@/lib/beacon';

export default function SellYourCoursePage() {
  const mountedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());

  useEffect(() => {
    const msToContent = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - mountedAt.current,
    );
    trackPageView('/sell-your-course', msToContent);
  }, []);

  return (
    <div className="-mx-4">
      {/* === NOT-LIVE BANNER — the honesty label, always visible, above everything === */}
      <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/25 text-center">
        <p className="text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5">
          <AlertTriangle size={13} />
          Coming soon — this doesn't exist yet. This page only measures interest.
        </p>
      </div>

      {/* === HERO === */}
      <section className="relative px-4 pt-8 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-2xl mx-auto text-center space-y-5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">An idea we're testing — not a feature</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-surface-100 leading-tight">
            Sell your course through Vidhya?
          </h1>
          <p className="text-base text-surface-400 leading-relaxed">
            We're exploring whether institutes and teachers would want to publish and sell their own
            course content — video lectures, notes, mock series — to students on Vidhya. Nothing here
            is built. We want to know if it's worth building <em>before</em> we build it.
          </p>
          <a
            href="#interest-form"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25"
          >
            Tell us this matters to you <ArrowRight size={14} />
          </a>
          <p className="text-xs text-surface-600">
            Clicking through registers interest only. It does not create a store, a listing, or a charge of any kind.
          </p>
        </motion.div>
      </section>

      {/* === THE HYPOTHETICAL — clearly framed as speculative === */}
      <section className="px-4 py-8 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xl font-bold text-surface-100 text-center mb-2 flex items-center justify-center gap-2"
        >
          <HelpCircle size={18} className="text-emerald-400" /> What we're imagining
        </motion.h2>
        <p className="text-xs text-surface-500 text-center mb-6">
          A sketch of the idea, not a spec — everything below is speculative.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              title: 'Your content, your name',
              desc: 'Institutes could package their own lectures, notes, or mock series and offer it to students already active on Vidhya.',
            },
            {
              title: 'You set the terms',
              desc: 'Pricing, bundling, and what counts as "your course" would be entirely up to the institute — none of that exists today.',
            },
            {
              title: 'Sits alongside the free tutor',
              desc: 'The AI tutor and adaptive practice students already use for free would stay free — this would be an optional layer on top.',
            },
            {
              title: 'We genuinely don’t know yet',
              desc: 'Whether this ships, what it would cost, and how revenue would work are all open questions this page is trying to answer.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-surface-900 border border-surface-800 border-dashed"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg text-emerald-400 bg-emerald-500/10 shrink-0">
                  <Store size={16} />
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

      {/* === EXPLICIT NON-CLAIM SECTION === */}
      <section className="px-4 py-8 bg-surface-900/40 border-y border-surface-800">
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-surface-950 border border-amber-500/20">
          <h2 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle size={14} /> To be completely clear
          </h2>
          <ul className="space-y-1.5 text-sm text-surface-400">
            <li>• There is no marketplace, storefront, or checkout on Vidhya today.</li>
            <li>• Registering interest does not reserve a spot, a price, or a revenue share.</li>
            <li>• No institute has course content for sale on Vidhya right now — this page can't lead you to one.</li>
            <li>• If we build this, pricing and terms will be worked out with early institutes directly, not set by this page.</li>
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
          <h2 className="text-lg font-bold text-surface-100 mb-1">Register interest — "sell your course"</h2>
          <p className="text-xs text-surface-500 mb-5">
            No commitment, no account, no charge. If enough institutes tell us this matters, we'll come
            back and talk through what it would actually look like.
          </p>
          <InterestForm
            kind="sell_course"
            sourcePage="/sell-your-course"
            messagePlaceholder="What would you want to sell? Video lectures, notes, mock series, something else?"
            submitLabel="Register interest — not a purchase"
          />
        </motion.div>
      </section>

      {/* === CROSS-LINK === */}
      <section className="px-4 py-8 text-center max-w-2xl mx-auto">
        <p className="text-sm text-surface-400">
          Looking for what Vidhya actually offers your batch today? See the{' '}
          <Link to="/institute" className="text-emerald-400 underline">institute one-pager</Link>.
        </p>
      </section>

      {/* === FOOTER === */}
      <section className="px-4 py-6 border-t border-surface-800 text-center text-xs text-surface-600">
        <p>Vidhya · demand-test page · nothing here is a live feature</p>
      </section>
    </div>
  );
}
