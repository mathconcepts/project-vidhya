/**
 * AnnouncementBanner
 *
 * Dismissible banner at top of student home showing the latest
 * announcement from the student's assigned teacher (if any).
 * Self-study students never see this.
 *
 * Dedupe logic: an announcement dismissed by timestamp won't appear
 * again. New announcement from the teacher (different posted_at)
 * overrides the dismiss.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';

interface Announcement {
  text: string;
  posted_at: string;
  teacher_name: string;
  teacher_id: string;
}

const DISMISS_KEY = 'vidhya.announcement.dismissed.v1';

function getDismissedKey(): string | null {
  try { return localStorage.getItem(DISMISS_KEY); } catch { return null; }
}
function markDismissed(posted_at: string) {
  try { localStorage.setItem(DISMISS_KEY, posted_at); } catch {}
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/teaching/announcement');
        if (!r.ok) return;
        const d = await r.json();
        if (!d.announcement) return;
        if (getDismissedKey() === d.announcement.posted_at) return;
        setAnnouncement(d.announcement);
      } catch {}
    })();
  }, []);

  if (!announcement) return null;

  const dismiss = () => {
    markDismissed(announcement.posted_at);
    setAnnouncement(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{ position: 'relative', padding: '12px 40px 12px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.06)', border: '1px solid rgba(88,86,214,.22)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Megaphone size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--indigo-ink)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--indigo-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'var(--weight-medium)' }}>
              From {announcement.teacher_name}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {announcement.text}
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="dismiss"
          style={{ position: 'absolute', top: 8, right: 8, padding: 4, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
