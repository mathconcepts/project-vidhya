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
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300 max-w-md mx-auto">
        {error}
      </div>
    );
  }

  if (cards == null) {
    return (
      <div className="flex items-center gap-2 text-surface-400 text-sm py-10 justify-center">
        <Loader2 size={14} className="animate-spin" /> Loading today's cards…
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <Sparkles size={32} className="text-emerald-400" />
        <h1 className="text-xl font-bold text-surface-100">{message ?? 'All caught up for today'}</h1>
        <p className="text-sm text-surface-500 max-w-sm">
          Come back tomorrow for your next round of recall practice.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold"
        >
          Back home
        </button>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === index ? 'w-8 bg-violet-500' : i < index ? 'w-2 bg-violet-500/40' : 'w-2 bg-surface-700'
            }`}
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
          className="p-6 rounded-2xl bg-surface-900 border border-surface-800 min-h-[280px] flex flex-col"
        >
          <div className="text-xs uppercase tracking-wider text-violet-300/80 mb-3">Recall</div>
          <div className="flex-1 prose prose-invert max-w-none text-surface-100 text-sm leading-relaxed whitespace-pre-wrap">
            {revealed ? card.content : card.content.split(/<details/)[0].trim()}
          </div>
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="mt-4 w-full px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm"
            >
              Reveal answer
            </button>
          )}
          {revealed && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-surface-800">
              <button
                onClick={() => submit(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm inline-flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} /> Not yet
              </button>
              <button
                onClick={() => submit(true)}
                className="flex-1 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Got it
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="text-center text-xs text-surface-500 mt-4">
        Card {index + 1} of {cards.length}
      </div>
    </div>
  );
}
