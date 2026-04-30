/**
 * StudentWelcomeCard
 *
 * Addresses user-journey pain points 1.1-1.4: first-arrival students
 * don't know what Vidhya can do, see a plan-setup form and bounce.
 *
 * This card surfaces three *demonstrated* capabilities — ask, snap,
 * upload — as tappable panels that take the student directly to the
 * relevant page. No signup wall, no tutorial, no form.
 *
 * Rendered ONLY when:
 *   - The user has not seen it before (checked via localStorage)
 *   - AND has no existing mastery state / sessions
 *
 * Dismissible forever with an X.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Camera, FileUp, X, Sparkles } from 'lucide-react';

const SEEN_KEY = 'vidhya.welcome.seen.v1';

export function hasSeenWelcome(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}

export function markWelcomeSeen(): void {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
}

interface Props {
  onDismiss?: () => void;
}

export function StudentWelcomeCard({ onDismiss }: Props) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => !hasSeenWelcome());

  if (!visible) return null;

  const dismiss = () => {
    markWelcomeSeen();
    setVisible(false);
    onDismiss?.();
  };

  const tryIt = (path: string) => {
    markWelcomeSeen();
    setVisible(false);
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative p-4 rounded-2xl bg-gradient-to-br from-violet-500/8 via-surface-900 to-emerald-500/8 border border-violet-500/20 space-y-3"
    >
      <button
        onClick={dismiss}
        aria-label="dismiss welcome"
        className="absolute top-2 right-2 p-1 rounded-lg text-surface-500 hover:text-surface-300"
      >
        <X size={13} />
      </button>

      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-violet-400" />
        <p className="text-sm font-medium text-surface-100">
          Hi, I'm Vidhya. Here are three things I can do right now.
        </p>
      </div>

      <p className="text-xs text-surface-400 leading-relaxed">
        No signup needed. Try any of these — if it clicks, keep going.
      </p>

      <div className="grid gap-2 pt-1">
        <WelcomeAction
          icon={MessageSquare}
          title="Ask a question"
          description="Type any question from your textbook — get a walkthrough, not just an answer."
          actionLabel="Try chat"
          onClick={() => tryIt('/chat')}
          tone="violet"
        />
        <WelcomeAction
          icon={Camera}
          title="Snap a problem"
          description="Photo of any handwritten or printed math problem. I'll read it and teach the method."
          actionLabel="Try snap"
          onClick={() => tryIt('/snap')}
          tone="emerald"
        />
        <WelcomeAction
          icon={FileUp}
          title="Upload your notes"
          description="Drop your class PDFs — I'll weave your own notes into every lesson."
          actionLabel="Try materials"
          onClick={() => tryIt('/materials')}
          tone="amber"
        />
      </div>

      <p className="text-[10px] text-surface-600 text-center pt-1">
        Your stuff stays on your device. Sign in later if you want cross-device sync.
      </p>
    </motion.div>
  );
}

// ============================================================================

function WelcomeAction({ icon: Icon, title, description, actionLabel, onClick, tone }: {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  tone: 'violet' | 'emerald' | 'amber';
}) {
  const toneAccent =
    tone === 'violet' ? 'text-violet-400'
    : tone === 'emerald' ? 'text-emerald-400'
    : 'text-amber-400';
  const toneBtn =
    tone === 'violet' ? 'text-violet-300 hover:text-violet-200'
    : tone === 'emerald' ? 'text-emerald-300 hover:text-emerald-200'
    : 'text-amber-300 hover:text-amber-200';

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-surface-950/60 border border-surface-800 hover:border-surface-700 text-left group transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center`}>
          <Icon size={14} className={toneAccent} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-200">{title}</p>
          <p className="text-[11px] text-surface-500 leading-relaxed mt-0.5">{description}</p>
          <p className={`text-[11px] mt-1.5 ${toneBtn} inline-flex items-center gap-1`}>
            {actionLabel} →
          </p>
        </div>
      </div>
    </button>
  );
}
