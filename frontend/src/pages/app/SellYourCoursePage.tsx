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
    <div style={{ margin: '0 -16px' }}>
      {/* NOT-LIVE BANNER */}
      <div style={{ padding: '10px 16px', background: 'rgba(255,149,0,.08)', borderBottom: '1px solid rgba(255,149,0,.25)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <AlertTriangle size={13} />
          Coming soon — this doesn't exist yet. This page only measures interest.
        </p>
      </div>

      {/* HERO */}
      <section style={{ padding: '32px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(52,199,89,.08)', border: '1px solid rgba(52,199,89,.22)' }}>
            <Sparkles size={13} style={{ color: 'var(--green-ink)' }} />
            <span style={{ fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--green-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>An idea we're testing — not a feature</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Sell your course through Vidhya?
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            We're exploring whether institutes and teachers would want to publish and sell their own
            course content — video lectures, notes, mock series — to students on Vidhya. Nothing here
            is built. We want to know if it's worth building <em>before</em> we build it.
          </p>
          <div>
            <a
              href="#interest-form"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 24px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', textDecoration: 'none' }}
            >
              Tell us this matters to you <ArrowRight size={14} />
            </a>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
            Clicking through registers interest only. It does not create a store, a listing, or a charge of any kind.
          </p>
        </motion.div>
      </section>

      {/* THE HYPOTHETICAL */}
      <section style={{ padding: '32px 16px', maxWidth: 672, margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <HelpCircle size={18} style={{ color: 'var(--green-ink)' }} /> What we're imagining
        </motion.h2>
        <p style={{ margin: '0 0 24px', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          A sketch of the idea, not a spec — everything below is speculative.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
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
              title: "We genuinely don't know yet",
              desc: 'Whether this ships, what it would cost, and how revenue would work are all open questions this page is trying to answer.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) dashed var(--separator)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'rgba(52,199,89,.08)', flexShrink: 0 }}>
                  <Store size={16} style={{ color: 'var(--green-ink)' }} />
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

      {/* EXPLICIT NON-CLAIM */}
      <section style={{ padding: '32px 16px', background: 'var(--surface-fill)', borderTop: 'var(--hairline) solid var(--separator)', borderBottom: 'var(--hairline) solid var(--separator)' }}>
        <div style={{ maxWidth: 672, margin: '0 auto', padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.25)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-bold)', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> To be completely clear
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'There is no marketplace, storefront, or checkout on Vidhya today.',
              'Registering interest does not reserve a spot, a price, or a revenue share.',
              "No institute has course content for sale on Vidhya right now — this page can't lead you to one.",
              'If we build this, pricing and terms will be worked out with early institutes directly, not set by this page.',
            ].map((item) => (
              <li key={item} style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>• {item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FORM */}
      <section id="interest-form" style={{ padding: '40px 16px', maxWidth: 672, margin: '0 auto', scrollMarginTop: 64 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
        >
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Register interest — "sell your course"</h2>
          <p style={{ margin: '0 0 20px', fontSize: 11, color: 'var(--text-tertiary)' }}>
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

      {/* CROSS-LINK */}
      <section style={{ padding: '32px 16px', textAlign: 'center', maxWidth: 672, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          Looking for what Vidhya actually offers your batch today? See the{' '}
          <Link to="/institute" style={{ color: 'var(--green-ink)' }}>institute one-pager</Link>.
        </p>
      </section>

      {/* FOOTER */}
      <section style={{ padding: '24px 16px', borderTop: 'var(--hairline) solid var(--separator)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>Vidhya · demand-test page · nothing here is a live feature</p>
      </section>
    </div>
  );
}
