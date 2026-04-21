/**
 * GiveawayBanner
 *
 * Student-facing banner. Shown when:
 *   1. Student is signed in
 *   2. Their assigned exam (user.exam_id) is a member of an approved ExamGroup
 *   3. They haven't permanently dismissed this specific group
 *
 * Makes the "one subscription, multiple exams" benefit explicit and
 * celebrated. Dismissal is per-group — if the admin adds a new approved
 * group later, the banner reappears.
 *
 * Self-gating: if the API returns null giveaway, renders nothing.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, ChevronRight } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';

interface GiveawayInfo {
  group_id: string;
  group_name: string;
  group_code: string;
  tagline?: string;
  benefits?: string[];
  description?: string;
  primary_exam: {
    id: string;
    code: string;
    name: string;
    source: 'dynamic' | 'static';
  };
  bonus_exams: Array<{
    id: string;
    code: string;
    name: string;
    source: 'dynamic' | 'static';
    completeness?: number;
  }>;
}

const DISMISS_KEY = 'vidhya.giveaway.dismissed.v1';

function getDismissedGroups(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markDismissed(group_id: string) {
  try {
    const current = getDismissedGroups();
    if (!current.includes(group_id)) {
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...current, group_id]));
    }
  } catch {}
}

export function GiveawayBanner() {
  const [info, setInfo] = useState<GiveawayInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/my-giveaway');
        if (!r.ok) return;
        const d = await r.json();
        if (!d.giveaway) return;
        // Respect per-group dismissal
        if (getDismissedGroups().includes(d.giveaway.group_id)) return;
        setInfo(d.giveaway);
      } catch {}
    })();
  }, []);

  if (!info) return null;

  const bonusCount = info.bonus_exams.length;
  const tagline = info.tagline || `One subscription — ${bonusCount + 1} exam${bonusCount === 0 ? '' : 's'}!`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        className="relative rounded-2xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-amber-500/15 border border-violet-500/40 overflow-hidden"
      >
        {/* Shimmer accent — deliberately subtle, just enough to read as 'bonus' */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
        />

        <button
          onClick={() => markDismissed(info.group_id) || setInfo(null)}
          aria-label="dismiss giveaway"
          className="absolute top-2 right-2 z-10 p-1 rounded text-surface-400 hover:text-surface-200"
        >
          <X size={12} />
        </button>

        <div className="p-4 pr-8 relative z-10">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Gift size={18} className="text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1">
                <Sparkles size={9} />
                Giveaway · included in your plan
              </p>
              <p className="text-sm font-semibold text-surface-100 mt-0.5">{tagline}</p>
              <p className="text-[11px] text-surface-400 mt-1">
                You're preparing for <span className="text-surface-200 font-medium">{info.primary_exam.name}</span>, and your plan also covers:
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 pl-13">
            {info.bonus_exams.slice(0, expanded ? undefined : 5).map(exam => (
              <span
                key={exam.id}
                className="text-[11px] px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-100 font-medium"
              >
                {exam.name}
              </span>
            ))}
            {!expanded && bonusCount > 5 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[11px] px-2 py-1 rounded-lg text-violet-300 hover:text-violet-200 inline-flex items-center gap-0.5"
              >
                +{bonusCount - 5} more
                <ChevronRight size={10} />
              </button>
            )}
          </div>

          {info.benefits && info.benefits.length > 0 && expanded && (
            <div className="mt-3 space-y-1">
              {info.benefits.map((b, i) => (
                <p key={i} className="text-[11px] text-surface-300 flex items-start gap-1.5">
                  <Sparkles size={9} className="shrink-0 mt-0.5 text-violet-400" />
                  {b}
                </p>
              ))}
            </div>
          )}

          {info.description && (
            <p className="text-[10px] text-surface-500 mt-3 leading-relaxed italic">
              {info.description}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
