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
        // Check dismissed
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
        className="relative p-3 pr-10 rounded-xl bg-sky-500/10 border border-sky-500/30"
      >
        <div className="flex items-start gap-2.5">
          <Megaphone size={13} className="shrink-0 mt-0.5 text-sky-400" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sky-400 uppercase tracking-wide font-medium">
              From {announcement.teacher_name}
            </p>
            <p className="text-[13px] text-surface-200 leading-relaxed mt-1">
              {announcement.text}
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="dismiss"
          className="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-surface-200"
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
