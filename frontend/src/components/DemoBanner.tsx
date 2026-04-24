/**
 * DemoBanner — a small, dismissible banner shown on gate pages to
 * users who are currently signed in as a demo user.
 *
 * Detection: user.email ends with @vidhya.local (our demo convention).
 *
 * Displayed: at the top of the main gate surfaces (PlannedSessionPage
 * is the primary integration point; other pages can opt in).
 *
 * Owning agent: conversion-specialist (outreach-manager / CMO).
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

function isDemoEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith('@vidhya.local');
}

export function DemoBanner() {
  const { user } = useAuth();
  if (!user || !isDemoEmail(user.email)) return null;

  return (
    <div className="bg-sky-900/40 border-b border-sky-800 px-4 py-2 text-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sky-200">
          <Sparkles size={14} className="flex-shrink-0" />
          <span>
            <strong>Demo mode</strong> — you're signed in as {user.name}. Your work
            here can be carried onto a real account at any time.
          </span>
        </div>
        <Link
          to="/gate/convert-demo"
          className="text-sky-300 hover:text-white font-medium whitespace-nowrap"
        >
          Make this real →
        </Link>
      </div>
    </div>
  );
}

export default DemoBanner;
