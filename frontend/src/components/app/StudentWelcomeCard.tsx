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
      style={{ position: 'relative', padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid rgba(88,86,214,.2)', boxShadow: 'var(--shadow-raise)', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <button
        onClick={dismiss}
        aria-label="dismiss welcome"
        style={{ position: 'absolute', top: 8, right: 8, padding: 4, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <X size={13} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={14} style={{ color: 'var(--indigo-ink)' }} />
        <p style={{ margin: 0, fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
          Hi, I'm Vidhya. Here are three things I can do right now.
        </p>
      </div>

      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
        No signup needed. Try any of these — if it clicks, keep going.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <WelcomeAction
          icon={MessageSquare}
          title="Ask a question"
          description="Type any question from your textbook — get a walkthrough, not just an answer."
          actionLabel="Try chat"
          onClick={() => tryIt('/chat')}
          accentColor="var(--indigo-ink)"
        />
        <WelcomeAction
          icon={Camera}
          title="Snap a problem"
          description="Photo of any handwritten or printed math problem. I'll read it and teach the method."
          actionLabel="Try snap"
          onClick={() => tryIt('/snap')}
          accentColor="var(--green-ink)"
        />
        <WelcomeAction
          icon={FileUp}
          title="Upload your notes"
          description="Drop your class PDFs — I'll weave your own notes into every lesson."
          actionLabel="Try materials"
          onClick={() => tryIt('/materials')}
          accentColor="var(--orange)"
        />
      </div>

      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 4 }}>
        Your stuff stays on your device. Sign in later if you want cross-device sync.
      </p>
    </motion.div>
  );
}

// ============================================================================

function WelcomeAction({ icon: Icon, title, description, actionLabel, onClick, accentColor }: {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color: accentColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{title}</p>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>{description}</p>
          <p style={{ margin: 0, fontSize: 11, color: accentColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {actionLabel} →
          </p>
        </div>
      </div>
    </button>
  );
}
