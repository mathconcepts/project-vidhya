/**
 * Splits a chat thread into "earlier" (a past visit) and "current" (the
 * most recent unbroken run of messages), so the tutor page can keep the
 * student's CURRENT question in focus instead of dropping them into a
 * long, unbroken scroll mixing today's question with everything they've
 * ever asked.
 *
 * Root cause (/investigate, 2026-09-07): `chat_messages` has no
 * thread/conversation concept at all — just `(session_id, role, content,
 * created_at)`. `useSession()`'s session id is a 365-day anonymous DEVICE
 * identity, not a per-sitting id, so `GET /api/chat/:sessionId` returns
 * every message the student has ever sent (up to 100), and `ChatPage.tsx`
 * rendered all of it, expanded, on every page load — a student's brand-new
 * question landed at the bottom of however many old, unrelated questions
 * they'd asked in prior visits. Closing that properly (real conversation
 * threads) is a schema change with real design questions (how does a
 * student browse past threads? does the tutor's LLM context span
 * threads?) — out of scope for this pass. This is the client-side fix
 * that solves the actual complaint (current question loses focus) without
 * losing any history: split by a time gap, show only the current run
 * expanded, keep everything older one tap away.
 */

/** 30 minutes with no message either way reads as "a different visit," not a pause mid-conversation. */
export const CHAT_CONVERSATION_GAP_MS = 30 * 60 * 1000;

export interface ChatHistorySplit<T> {
  earlier: T[];
  current: T[];
}

interface TimestampedMessage {
  created_at?: string;
}

/**
 * `messages` must already be in ascending chronological order (the API
 * returns them `ORDER BY created_at ASC`). Walks the message timestamps
 * PLUS an implicit trailing boundary at `now`, and finds the LAST gap
 * exceeding `gapMs` — everything from there onward is "current"; everything
 * before is "earlier". The trailing `now` boundary matters: without it, a
 * short, internally-tight conversation from a week ago (no gap between its
 * OWN messages) would still read as "current" on a fresh page load just
 * because nothing inside it happened to be far apart — the actual bug
 * this fix exists to close. Multiple old visits collapse into one
 * "earlier" bucket; only the most recent run, if it's still recent
 * relative to `now`, counts as current.
 *
 * Fails open, never hides data: an empty list returns both empty; any
 * message missing/carrying an unparseable `created_at` returns everything
 * as `current` rather than guessing.
 */
export function splitChatHistoryByRecency<T extends TimestampedMessage>(
  messages: T[],
  gapMs: number = CHAT_CONVERSATION_GAP_MS,
  now: number = Date.now(),
): ChatHistorySplit<T> {
  if (messages.length === 0) {
    return { earlier: [], current: [] };
  }

  const timestamps = messages.map(m => (m.created_at ? Date.parse(m.created_at) : NaN));
  if (timestamps.some(t => Number.isNaN(t))) {
    return { earlier: [], current: messages };
  }

  const boundaries = [...timestamps, now];
  let splitIndex = 0;
  for (let i = 1; i < boundaries.length; i++) {
    if (boundaries[i] - boundaries[i - 1] > gapMs) {
      splitIndex = i;
    }
  }

  return {
    earlier: messages.slice(0, splitIndex),
    current: messages.slice(splitIndex),
  };
}
