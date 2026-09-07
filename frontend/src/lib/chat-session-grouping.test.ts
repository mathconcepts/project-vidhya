import { describe, it, expect } from 'vitest';
import { splitChatHistoryByRecency, CHAT_CONVERSATION_GAP_MS } from './chat-session-grouping';

const MIN = 60_000;
const ts = (minutesFromEpoch: number) => new Date(minutesFromEpoch * MIN).toISOString();
const nowAt = (minutesFromEpoch: number) => minutesFromEpoch * MIN;

function msg(id: string, minute: number) {
  return { id, created_at: ts(minute) };
}

describe('splitChatHistoryByRecency', () => {
  it('treats a single unbroken, still-recent run as entirely current', () => {
    const messages = [msg('a', 0), msg('b', 1), msg('c', 2)];
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(3));
    expect(earlier).toEqual([]);
    expect(current).toEqual(messages);
  });

  it('splits at an internal gap when the most recent run is still recent', () => {
    const messages = [
      msg('old-1', 0),
      msg('old-2', 5),
      // 45-minute gap > 30-minute threshold
      msg('new-1', 50),
      msg('new-2', 52),
    ];
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(53));
    expect(earlier.map(m => m.id)).toEqual(['old-1', 'old-2']);
    expect(current.map(m => m.id)).toEqual(['new-1', 'new-2']);
  });

  it('does not split on an internal gap under the threshold', () => {
    const messages = [msg('a', 0), msg('b', 20)]; // 20 min < 30 min
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(21));
    expect(earlier).toEqual([]);
    expect(current).toEqual(messages);
  });

  it('collapses multiple old visits into one earlier bucket, keeping only the most recent run current', () => {
    const messages = [
      msg('visit1-a', 0),
      msg('visit1-b', 2),
      // gap
      msg('visit2-a', 100),
      msg('visit2-b', 101),
      // gap
      msg('visit3-a', 500),
      msg('visit3-b', 501),
    ];
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(502));
    expect(earlier.map(m => m.id)).toEqual(['visit1-a', 'visit1-b', 'visit2-a', 'visit2-b']);
    expect(current.map(m => m.id)).toEqual(['visit3-a', 'visit3-b']);
  });

  it('treats a stale, internally-tight conversation as entirely earlier — the core bug this fix closes', () => {
    // Two messages one minute apart (no internal gap at all), but the whole
    // exchange happened long before "now": without checking the gap to now,
    // this would wrongly render as the CURRENT conversation on a fresh visit.
    const messages = [msg('a', 0), msg('b', 1)];
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(10_000));
    expect(earlier).toEqual(messages);
    expect(current).toEqual([]);
  });

  it('respects a custom gap threshold, including against the trailing now-boundary', () => {
    const messages = [msg('a', 0), msg('b', 10)]; // 10 min apart
    const tight = splitChatHistoryByRecency(messages, 5 * MIN, nowAt(11)); // 5-min threshold, b is 1 min before now
    expect(tight.earlier.map(m => m.id)).toEqual(['a']);
    expect(tight.current.map(m => m.id)).toEqual(['b']);

    const loose = splitChatHistoryByRecency(messages, 60 * MIN, nowAt(11)); // 60-min threshold
    expect(loose.earlier).toEqual([]);
    expect(loose.current).toEqual(messages);
  });

  it('handles a single message the same way: recent stays current, stale becomes earlier', () => {
    const recent = splitChatHistoryByRecency([msg('a', 0)], CHAT_CONVERSATION_GAP_MS, nowAt(1));
    expect(recent).toEqual({ earlier: [], current: [msg('a', 0)] });

    const stale = splitChatHistoryByRecency([msg('a', 0)], CHAT_CONVERSATION_GAP_MS, nowAt(10_000));
    expect(stale).toEqual({ earlier: [msg('a', 0)], current: [] });
  });

  it('returns both empty for an empty list', () => {
    expect(splitChatHistoryByRecency([])).toEqual({ earlier: [], current: [] });
  });

  it('fails open when any message is missing created_at', () => {
    const messages: { id: string; created_at?: string }[] = [msg('a', 0), { id: 'b' }, msg('c', 500)];
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(10_000));
    expect(earlier).toEqual([]);
    expect(current).toEqual(messages);
  });

  it('fails open when created_at is unparseable', () => {
    const messages = [msg('a', 0), { id: 'b', created_at: 'not-a-date' }, msg('c', 500)];
    const { earlier, current } = splitChatHistoryByRecency(messages, CHAT_CONVERSATION_GAP_MS, nowAt(10_000));
    expect(earlier).toEqual([]);
    expect(current).toEqual(messages);
  });

  it('defaults `now` to the real clock and the gap to 30 minutes', () => {
    expect(CHAT_CONVERSATION_GAP_MS).toBe(30 * MIN);
    // A message from right now, with no explicit `now` argument, is current.
    const { earlier, current } = splitChatHistoryByRecency([{ id: 'a', created_at: new Date().toISOString() }]);
    expect(earlier).toEqual([]);
    expect(current).toHaveLength(1);
  });
});
