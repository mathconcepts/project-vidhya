/**
 * ConvertDemoPage — the "Make this real" CTA destination.
 *
 * Route: /gate/convert-demo
 *
 * Owning agent: conversion-specialist (under outreach-manager, CMO).
 *
 * Flow:
 *   1. Page detects demo mode (user.email ends with @vidhya.local)
 *   2. User enters their real email + name
 *   3. POST /api/demo/convert with carry_over=true
 *   4. Backend returns { real_user, carried_over, anonymised }
 *   5. Page shows success summary ("6 plans, 3 templates, 97 min carried over")
 *   6. Page mints a new JWT for the real account (or prompts Google sign-in
 *      on a production deployment) and redirects to /gate/planned
 *
 * Non-demo users see a friendly explainer that this page is for demo
 * conversion only.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/auth/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sparkles, ArrowRight, CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react';

interface ConvertResponse {
  ok: boolean;
  real_user?: { id: string; email: string; name: string };
  carried_over?: {
    exam_profiles: number;
    session_plans: number;
    plan_templates: number;
    practice_sessions: number;
  };
  anonymised?: { demo_log_entries: number };
  note?: string;
  error?: string;
}

function isDemoUser(email: string | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith('@vidhya.local');
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-fill)',
  border: 'var(--hairline) solid var(--separator)',
  fontSize: 'var(--text-caption)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
};

export default function ConvertDemoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [realEmail, setRealEmail] = useState('');
  const [realName, setRealName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);

  if (user && !isDemoUser(user.email)) {
    return (
      <div style={{ maxWidth: 608, margin: '0 auto', padding: '32px 0' }}>
        <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>This page is for demo conversion</h1>
          <p style={{ margin: '0 0 16px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            You're signed in as <strong>{user.name}</strong> ({user.email}) — a real account,
            not a demo user. Nothing to convert.
          </p>
          <button
            onClick={() => navigate('/planned')}
            style={{ background: 'none', border: 'none', color: 'var(--indigo-ink)', fontSize: 'var(--text-caption)', cursor: 'pointer', padding: 0 }}
          >
            Back to planned session →
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!realEmail || !realName) {
      setError('Email and name are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const google_sub = `demo-convert-${realEmail.replace(/[^a-zA-Z0-9]/g, '')}`;
      const res = await authFetch('/api/demo/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_sub,
          email: realEmail,
          name: realName,
          carry_over: true,
        }),
      });

      const body = (await res.json()) as ConvertResponse;
      if (!res.ok || !body.ok) {
        setError(body.error ?? `Conversion failed (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }

      setResult(body);
      setSubmitting(false);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) ?? 'Network error');
      setSubmitting(false);
    }
  }

  // ─── Success state ────────────────────────────────────────────────

  if (result && result.ok && result.carried_over) {
    const co = result.carried_over;

    return (
      <div style={{ maxWidth: 608, margin: '0 auto', padding: '32px 0' }}>
        <div style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <CheckCircle2 size={24} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Your demo is now real</h1>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                An account has been created for <strong>{result.real_user?.email}</strong>.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 'var(--text-caption)' }}>
            {[
              { label: 'Exam profiles carried over', value: co.exam_profiles },
              { label: 'Session plans', value: co.session_plans },
              { label: 'Templates', value: co.plan_templates },
              { label: 'Practice sessions', value: co.practice_sessions },
            ].map(item => (
              <div key={item.label} style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginTop: 2 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {result.anonymised?.demo_log_entries !== undefined && (
            <div style={{ marginTop: 16, fontSize: 10, color: 'var(--text-tertiary)' }}>
              {result.anonymised.demo_log_entries} demo-usage-log entries anonymised —
              the owner can see cohort conversion patterns but not your per-user activity.
            </div>
          )}

          <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,149,0,.06)', border: '1px solid rgba(255,149,0,.22)' }}>
            <strong style={{ display: 'block', marginBottom: 4, fontSize: 11, color: 'var(--orange)' }}>Next step — sign in with Google</strong>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
              In production, the next step is to complete Google sign-in with the real
              email address so a full JWT is issued for your real account. For this demo
              environment, you can continue using the product; your work has been copied
              onto the real account behind the scenes.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => navigate('/planned')}
              style={{ width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-caption)', border: 'none', cursor: 'pointer' }}
            >
              Back to planned session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form state ────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 608, margin: '0 auto', padding: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--indigo-ink)', marginBottom: 8 }}>
        <Sparkles size={16} />
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--weight-semibold)' }}>Make this real</span>
      </div>

      <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>Keep what you've practiced</h1>

      {user && (
        <p style={{ margin: '0 0 24px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          You're currently signed in as <strong>{user.name}</strong>, a demo account.
          Signing up will copy your exam profile, plan history, templates, and practice
          log onto a real account. Your trailing-stats badge doesn't reset — your work
          comes with you.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 6 }} htmlFor="real-name">
            Your name
          </label>
          <input
            id="real-name"
            type="text"
            value={realName}
            onChange={e => setRealName(e.target.value)}
            placeholder="Priya Sharma"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: 6 }} htmlFor="real-email">
            Your real email
          </label>
          <input
            id="real-email"
            type="email"
            value={realEmail}
            onChange={e => setRealEmail(e.target.value)}
            placeholder="priya@example.com"
            style={inputStyle}
            required
          />
          <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-tertiary)' }}>
            In production this step is handled via Google sign-in. For the demo, we create
            a stub account bound to this email.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>What gets copied:</strong>
          Registered exams, session plan history, saved templates, practice log entries.
          Trailing-stats badge stays at its current value.
          <br /><br />
          <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>What doesn't:</strong>
          Attention-store entries (ephemeral by design). Demo-usage-log entries tied to
          the converting demo user are anonymised — the owner keeps the cohort aggregate
          but loses the per-user link.
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: submitting ? 'var(--surface-fill)' : 'var(--indigo)',
            color: submitting ? 'var(--text-tertiary)' : '#fff',
            fontWeight: 'var(--weight-semibold)',
            fontSize: 'var(--text-caption)',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Converting…
            </>
          ) : (
            <>
              Make this real
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
