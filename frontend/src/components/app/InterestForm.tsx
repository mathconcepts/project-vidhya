/**
 * InterestForm — shared "register your interest" form for the U1-10
 * demand-test pages (institute one-pager + sell-your-course fake door).
 *
 * Posts to POST /api/interest (src/api/interest-routes.ts). This is a
 * lead-capture form, not a live transaction of any kind — see
 * DESIGN-SYSTEM.md / CLAUDE.md's "labels never lie" law. The success
 * state reflects exactly what the backend reports: if the deploy has no
 * database configured, we say so rather than implying the request was
 * saved somewhere it wasn't.
 */

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, Mail } from 'lucide-react';

export type InterestKind = 'institute_batch' | 'sell_course';

interface Props {
  kind: InterestKind;
  sourcePage: string;
  /** Placeholder text for the free-text message field. */
  messagePlaceholder?: string;
  /** Label on the submit button. */
  submitLabel?: string;
  /** Fallback mailto address shown alongside the form. */
  mailto?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function InterestForm({
  kind,
  sourcePage,
  messagePlaceholder = 'Anything specific you want to tell us?',
  submitLabel = 'Register interest',
  mailto = 'hello@vidhya.app',
}: Props) {
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setStatus('error');
      setErrorMsg('Name and email are required.');
      return;
    }
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          org_name: orgName.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          source_page: sourcePage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data?.error || 'Something went wrong — please try the email link below instead.');
        return;
      }
      setStatus('success');
      setNote(data?.persisted === false ? data?.note ?? null : null);
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please try the email link below instead.');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-2"
      >
        <CheckCircle2 size={22} className="text-emerald-400 mx-auto" />
        <p className="text-sm font-semibold text-surface-100">Got it — we'll be in touch.</p>
        <p className="text-xs text-surface-400">
          This just registers your interest — nothing is live yet, and no payment or account was created.
        </p>
        {note && <p className="text-[11px] text-amber-400/90 mt-1">{note}</p>}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-surface-400 mb-1" htmlFor={`${kind}-name`}>
            Your name *
          </label>
          <input
            id={`${kind}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/50"
            placeholder="Priya Sharma"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-400 mb-1" htmlFor={`${kind}-org`}>
            Institute / batch name
          </label>
          <input
            id={`${kind}-org`}
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/50"
            placeholder="Apex GATE Academy"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-surface-400 mb-1" htmlFor={`${kind}-email`}>
            Email *
          </label>
          <input
            id={`${kind}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/50"
            placeholder="priya@apexgate.in"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-400 mb-1" htmlFor={`${kind}-phone`}>
            Phone (optional)
          </label>
          <input
            id={`${kind}-phone`}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/50"
            placeholder="+91 90000 00000"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-surface-400 mb-1" htmlFor={`${kind}-message`}>
          Message (optional)
        </label>
        <textarea
          id={`${kind}-message`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-100 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/50 resize-none"
          placeholder={messagePlaceholder}
        />
      </div>

      <AnimatePresence>
        {status === 'error' && errorMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-red-400"
          >
            <AlertCircle size={13} /> {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-60"
        >
          {status === 'submitting' ? <Loader2 size={14} className="animate-spin" /> : null}
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </button>
        <a
          href={`mailto:${mailto}?subject=${encodeURIComponent(
            kind === 'institute_batch' ? 'Bring your batch to Vidhya' : 'Interested: sell your course on Vidhya',
          )}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-surface-800 text-surface-300 text-sm font-semibold hover:border-violet-500/40"
        >
          <Mail size={14} /> Or email us
        </a>
      </div>
      <p className="text-[11px] text-surface-600">
        This registers your interest only — it doesn't create an account, start a trial, or charge anything.
      </p>
    </form>
  );
}
