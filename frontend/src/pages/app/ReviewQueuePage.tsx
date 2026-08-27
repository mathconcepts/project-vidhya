/**
 * ReviewQueuePage — admin page at /admin/review-queue.
 *
 * D4: the approval surface that ships BEFORE the 50-item anatomy pilot,
 * because the pilot measures operator minutes-per-item and there was
 * previously no surface to measure — items were reviewed by hand-editing
 * JSON. See docs/ops/content-verification-runbook.md for the pilot
 * procedure that runs through this page.
 *
 * Auth: admin role only, same gate shape as ContentRDPage.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/auth/roles';
import { trackEvent } from '@/lib/analytics';
import { ReviewQueuePanel } from '@/components/admin/ReviewQueuePanel';

export default function ReviewQueuePage() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    trackEvent('page_view', { page: 'admin-review-queue' });
  }, []);

  if (authLoading) return null;

  if (!user || !isAdminRole(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <Shield size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>
          Admin access required
        </h2>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          The review queue decides answer keys, so it is gated to admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={20} style={{ color: 'var(--indigo-ink)' }} />
          Answer-key review
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-normal)' }}>
          Generated items cannot be promoted or served until all five quality gates pass. Four are
          decided mechanically at generation time; the <code>mathematics</code> gate — is the answer
          key right? — is yours, and only yours.
        </p>
      </motion.header>

      <ReviewQueuePanel />
    </div>
  );
}
