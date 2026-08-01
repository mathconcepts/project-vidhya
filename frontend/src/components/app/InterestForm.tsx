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
  messagePlaceholder?: string;
  submitLabel?: string;
  mailto?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-card)',
  border: 'var(--hairline) solid var(--separator)',
  fontSize: 'var(--text-body)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-caption)',
  fontWeight: 'var(--weight-semibold)',
  color: 'var(--text-tertiary)',
  marginBottom: 4,
};

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
        style={{ padding: 20, borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}
      >
        <CheckCircle2 size={22} style={{ color: 'var(--green-ink)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>Got it — we'll be in touch.</p>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          This just registers your interest — nothing is live yet, and no payment or account was created.
        </p>
        {note && <p style={{ margin: 0, fontSize: 11, color: 'var(--orange)' }}>{note}</p>}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor={`${kind}-name`}>Your name *</label>
          <input id={`${kind}-name`} type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="Priya Sharma" />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`${kind}-org`}>Institute / batch name</label>
          <input id={`${kind}-org`} type="text" value={orgName} onChange={e => setOrgName(e.target.value)} style={inputStyle} placeholder="Apex GATE Academy" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor={`${kind}-email`}>Email *</label>
          <input id={`${kind}-email`} type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="priya@apexgate.in" />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`${kind}-phone`}>Phone (optional)</label>
          <input id={`${kind}-phone`} type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+91 90000 00000" />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor={`${kind}-message`}>Message (optional)</label>
        <textarea
          id={`${kind}-message`}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
          placeholder={messagePlaceholder}
        />
      </div>

      <AnimatePresence>
        {status === 'error' && errorMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--red)' }}
          >
            <AlertCircle size={13} /> {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-bold)', border: 'none', cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.6 : 1 }}
        >
          {status === 'submitting' ? <Loader2 size={14} className="animate-spin" /> : null}
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </button>
        <a
          href={`mailto:${mailto}?subject=${encodeURIComponent(
            kind === 'institute_batch' ? 'Bring your batch to Vidhya' : 'Interested: sell your course on Vidhya',
          )}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', textDecoration: 'none' }}
        >
          <Mail size={14} /> Or email us
        </a>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>
        This registers your interest only — it doesn't create an account, start a trial, or charge anything.
      </p>
    </form>
  );
}
