import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatPage from './ChatPage';

// jsdom doesn't implement scrollIntoView — same shim LessonPage.test.tsx uses.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('@/hooks/useSession', () => ({ useSession: () => 'test-session-1' }));
vi.mock('@/hooks/useActiveExam', () => ({ useActiveExam: () => ({ exam: null, loading: false, error: false }) }));
vi.mock('@/hooks/useStorageMode', () => ({
  useStorageMode: () => ({ mode: 'postgres', effectiveMode: 'postgres', setMode: vi.fn(), groundingCount: 0 }),
}));

function renderChatPage() {
  return render(
    <MemoryRouter initialEntries={['/chat']}>
      <ChatPage />
    </MemoryRouter>,
  );
}

// ChatPage uses splitChatHistoryByRecency's default `now = Date.now()`, so
// fixture timestamps are expressed relative to the real wall clock at test
// time (generous margins to stay robust against slow CI runs).
const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

describe('ChatPage — earlier-visit history stays out of the way', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('keeps only the current unbroken run expanded; older messages collapse behind a toggle', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: [
          { id: 'old-1', role: 'user', content: 'What is a subspace?', created_at: minutesAgo(90) },
          { id: 'old-2', role: 'assistant', content: 'A subspace is...', created_at: minutesAgo(89) },
          // >30-minute gap to the messages below — a different visit
          { id: 'new-1', role: 'user', content: 'Explain eigenvalues', created_at: minutesAgo(2) },
          { id: 'new-2', role: 'assistant', content: 'An eigenvalue is...', created_at: minutesAgo(1) },
        ],
      }),
    }) as any;

    renderChatPage();

    await waitFor(() => expect(screen.getByText('Explain eigenvalues')).toBeInTheDocument());

    // The current run's question is directly visible.
    expect(screen.getByText('An eigenvalue is...')).toBeInTheDocument();

    // The old visit is NOT expanded on load — it must not compete for focus.
    expect(screen.queryByText('What is a subspace?')).not.toBeInTheDocument();
    expect(screen.getByTestId('earlier-chat-toggle')).toHaveTextContent('2 messages from an earlier visit');

    // Tapping the toggle reveals it, clearly separated (not mixed into the main list).
    fireEvent.click(screen.getByTestId('earlier-chat-toggle'));
    await waitFor(() => expect(screen.getByText('What is a subspace?')).toBeInTheDocument());
    expect(screen.getByTestId('earlier-chat-messages')).toContainElement(screen.getByText('What is a subspace?'));
  });

  it('renders no earlier-visit toggle when the whole history is one recent unbroken run', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: [
          { id: 'a', role: 'user', content: 'Question one', created_at: minutesAgo(2) },
          { id: 'b', role: 'assistant', content: 'Answer one', created_at: minutesAgo(1) },
        ],
      }),
    }) as any;

    renderChatPage();

    await waitFor(() => expect(screen.getByText('Question one')).toBeInTheDocument());
    expect(screen.queryByTestId('earlier-chat-toggle')).not.toBeInTheDocument();
  });

  it('shows the welcome/suggestions screen when the only history is an old visit — not a stale wall of text', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: [
          // Internally tight (1 minute apart) but both from long before "now" —
          // exactly the case a message-to-message-only gap check would miss.
          { id: 'old-1', role: 'user', content: 'A very old question', created_at: minutesAgo(120) },
          { id: 'old-2', role: 'assistant', content: 'A very old answer', created_at: minutesAgo(119) },
        ],
      }),
    }) as any;

    renderChatPage();

    await waitFor(() => expect(screen.getByText('Your Anytime Tutor')).toBeInTheDocument());
    expect(screen.queryByText('A very old question')).not.toBeInTheDocument();
    expect(screen.getByTestId('earlier-chat-toggle')).toBeInTheDocument();
  });
});
