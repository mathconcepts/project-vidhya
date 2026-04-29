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

export default function ConvertDemoPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [realEmail, setRealEmail] = useState('');
  const [realName, setRealName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);

  // Guard — only demo users convert. Non-demo users see an explanation.
  if (user && !isDemoUser(user.email)) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h1 className="text-xl font-bold text-white mb-2">This page is for demo conversion</h1>
          <p className="text-slate-300 mb-4">
            You're signed in as <strong>{user.name}</strong> ({user.email}) — a real account,
            not a demo user. Nothing to convert.
          </p>
          <button
            onClick={() => navigate('/planned')}
            className="text-sky-400 hover:text-sky-300"
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
      // In production this endpoint would be reached after a client-side
      // Google sign-in; google_sub would come from the verified id_token.
      // For the demo we synthesise a stable sub from the email.
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
      // In a production deployment, after conversion the client would
      // initiate Google sign-in flow for the new account, which would
      // mint a real JWT via the existing sign-in route. For the demo
      // we leave the user signed in as the (now-converted) demo user;
      // the next page load can re-auth via Google.
      setSubmitting(false);
    } catch (err: any) {
      setError(err?.message ?? 'Network error');
      setSubmitting(false);
    }
  }

  // ─── Success state ────────────────────────────────────────────────

  if (result && result.ok && result.carried_over) {
    const co = result.carried_over;
    const total =
      co.exam_profiles + co.session_plans + co.plan_templates + co.practice_sessions;

    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Your demo is now real</h1>
              <p className="text-slate-300 text-sm">
                An account has been created for <strong>{result.real_user?.email}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-800/50 rounded p-3">
              <div className="text-slate-400 text-xs">Exam profiles carried over</div>
              <div className="text-white text-lg font-semibold">{co.exam_profiles}</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3">
              <div className="text-slate-400 text-xs">Session plans</div>
              <div className="text-white text-lg font-semibold">{co.session_plans}</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3">
              <div className="text-slate-400 text-xs">Templates</div>
              <div className="text-white text-lg font-semibold">{co.plan_templates}</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3">
              <div className="text-slate-400 text-xs">Practice sessions</div>
              <div className="text-white text-lg font-semibold">{co.practice_sessions}</div>
            </div>
          </div>

          {result.anonymised?.demo_log_entries !== undefined && (
            <div className="mt-4 text-xs text-slate-400">
              {result.anonymised.demo_log_entries} demo-usage-log entries anonymised —
              the owner can see cohort conversion patterns but not your per-user activity.
            </div>
          )}

          <div className="mt-6 bg-amber-900/20 border border-amber-700 rounded p-3 text-xs text-amber-100">
            <strong className="block mb-1">Next step — sign in with Google</strong>
            In production, the next step is to complete Google sign-in with the real
            email address so a full JWT is issued for your real account. For this demo
            environment, you can continue using the product; your work has been copied
            onto the real account behind the scenes.
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate('/planned')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded px-4 py-2 text-sm font-medium transition"
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
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-2 text-sky-400 mb-2">
        <Sparkles size={18} />
        <span className="text-xs uppercase tracking-wider font-semibold">Make this real</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-3">Keep what you've practiced</h1>

      {user && (
        <p className="text-slate-400 text-sm mb-6">
          You're currently signed in as <strong>{user.name}</strong>, a demo account.
          Signing up will copy your exam profile, plan history, templates, and practice
          log onto a real account. Your trailing-stats badge doesn't reset — your work
          comes with you.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1" htmlFor="real-name">
            Your name
          </label>
          <input
            id="real-name"
            type="text"
            value={realName}
            onChange={e => setRealName(e.target.value)}
            placeholder="Priya Sharma"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1" htmlFor="real-email">
            Your real email
          </label>
          <input
            id="real-email"
            type="email"
            value={realEmail}
            onChange={e => setRealEmail(e.target.value)}
            placeholder="priya@example.com"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            In production this step is handled via Google sign-in. For the demo, we create
            a stub account bound to this email.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-800 rounded p-3 text-sm text-red-200">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700 rounded p-3 text-xs text-slate-400">
          <strong className="text-slate-300 block mb-1">What gets copied:</strong>
          Registered exams, session plan history, saved templates, practice log entries.
          Trailing-stats badge stays at its current value.
          <br /><br />
          <strong className="text-slate-300 block mb-1">What doesn't:</strong>
          Attention-store entries (ephemeral by design). Demo-usage-log entries tied to
          the converting demo user are anonymised — the owner keeps the cohort aggregate
          but loses the per-user link.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded px-4 py-2.5 text-sm font-medium transition flex items-center justify-center gap-2"
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
