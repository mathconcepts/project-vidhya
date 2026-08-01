/**
 * DailyCardsPage — minimal flip-card daily habit loop (E8).
 *
 * Route: /daily
 *
 * Calls POST /api/daily-cards with the student's IndexedDB visit map
 * (mirrors review-today pattern — preserves DB-less SR architecture).
 * Returns 1 retrieval_prompt atom per mastered concept due today via SM-2.
 *
 * On answer (Got it / Not yet):
 *   - Updates IndexedDB last_lesson_visit via updateVisitState (client-side
 *     SM-2; server doesn't store SR state)
 *   - POSTs engagement to /api/lesson/:concept_id/engagement so cohort
 *     aggregation has the recall_correct signal
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import type { ContentAtom } from '@/components/lesson/AtomCardRenderer';

interface StoredVisit {
  last_visited_at: string;
  sm2_interval_days: number;
  sm2_easiness?: number;
  sm2_repetitions?: number;
  quality_history?: number[];
}

const VISITS_KEY = 'vidhya.last_lesson_visit';

function loadVisits(): Record<string, StoredVisit> {
  try {
    return JSON.parse(localStorage.getItem(VISITS_KEY) || '{}');
  } catch {
    return {};
  }
}

function loadMastery(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('vidhya.mastery_by_concept') || '{}');
  } catch {
    return {};
  }
}

export default function DailyCardsPage() {
  const navigate = useNavigate();
  const sessionId = useSession();
  const [cards, setCards] = useState<ContentAtom[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const visits = loadVisits();
    const mastery = loadMastery();
    fetch('/api/daily-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_lesson_visit: visits,
        mastery_by_concept: mastery,
      }),
    })
      .then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error)))))
      .then((data: { cards: ContentAtom[]; message?: string }) => {
        setCards(data.cards ?? []);
        setMessage(data.message ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const submit = async (correct: boolean) => {
    const card = cards?.[index];
    if (!card) return;
    if (sessionId) {
      try {
        await fetch(`/api/lesson/${encodeURIComponent(card.concept_id)}/engagement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            atom_id: card.id,
            time_ms: 0,
            skipped: false,
            recall_correct: correct,
            student_id: sessionId,
          }),
        });
      } catch { /* fire and forget */ }
    }
    // Client-side SM-2 advance
    const visits = loadVisits();
    const prev = visits[card.concept_id];
    const quality = correct ? 4 : 1;
    const nextInterval = correct ? Math.max(1, (prev?.sm2_interval_days ?? 1) * 2) : 1;
    visits[card.concept_id] = {
      last_visited_at: new Date().toISOString(),
      sm2_interval_days: nextInterval,
      sm2_easiness: prev?.sm2_easiness ?? 2.5,
      sm2_repetitions: correct ? (prev?.sm2_repetitions ?? 0) + 1 : 0,
      quality_history: [...(prev?.quality_history ?? []), quality].slice(-10),
    };
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));

    if (cards && index < cards.length - 1) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      navigate('/');
    }
  };

  if (error) {
    return (
      <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', fontSize: 'var(--text-caption)', color: 'var(--red)', maxWidth: 448, margin: '0 auto' }}>
        {error}
      </div>
    );
  }

  if (cards == null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)', padding: '40px 0', justifyContent: 'center' }}>
        <Loader2 size={14} className="animate-spin" /> Loading today's cards…
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', padding: '0 16px' }}>
        <Sparkles size={32} style={{ color: 'var(--green-ink)' }} />
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)' }}>{message ?? 'All caught up for today'}</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', maxWidth: 320 }}>
          Come back tomorrow for your next round of recall practice.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: 8, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', border: 'none', cursor: 'pointer' }}
        >
          Back home
        </button>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div style={{ maxWidth: 448, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              height: 4,
              borderRadius: 999,
              transition: 'all 0.2s',
              width: i === index ? 32 : 8,
              background: i <= index ? 'var(--indigo-ink)' : 'var(--surface-fill)',
              opacity: i < index ? 0.4 : 1,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.4 }}
          style={{ padding: 24, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)', minHeight: 280, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-raise)' }}
        >
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--indigo-ink)', marginBottom: 12 }}>Recall</div>
          <div style={{ flex: 1, color: 'var(--text-primary)', fontSize: 'var(--text-caption)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
            {revealed ? card.content : card.content.split(/<details/)[0].trim()}
          </div>
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              style={{ marginTop: 16, width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', cursor: 'pointer' }}
            >
              Reveal answer
            </button>
          )}
          {revealed && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: 'var(--hairline) solid var(--separator)' }}>
              <button
                onClick={() => submit(false)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-fill)', border: 'var(--hairline) solid var(--separator)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
              >
                <XCircle size={14} /> Not yet
              </button>
              <button
                onClick={() => submit(true)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--green)', color: '#fff', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-semibold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer' }}
              >
                <CheckCircle2 size={14} /> Got it
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 16 }}>
        Card {index + 1} of {cards.length}
      </div>
    </div>
  );
}
