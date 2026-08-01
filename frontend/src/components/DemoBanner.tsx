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
    <div style={{
      background: 'rgba(88,86,214,.06)',
      borderBottom: '1px solid rgba(88,86,214,.22)',
      padding: '8px 16px',
      fontSize: 'var(--text-caption)',
    }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Sparkles size={14} style={{ flexShrink: 0, color: 'var(--indigo-ink)' }} />
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>Demo mode</strong> — you're signed in as {user.name}. Your work
            here can be carried onto a real account at any time.
          </span>
        </div>
        <Link
          to="/convert-demo"
          style={{ color: 'var(--indigo-ink)', fontWeight: 'var(--weight-medium)', whiteSpace: 'nowrap', textDecoration: 'none' }}
        >
          Make this real →
        </Link>
      </div>
    </div>
  );
}

export default DemoBanner;
