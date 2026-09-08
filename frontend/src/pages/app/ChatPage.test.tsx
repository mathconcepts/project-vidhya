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

// Root-caused by /investigate (2026-09-07, live-QA screenshots of the AI
// Tutor Chat page): assistant replies rendered as raw string interpolation
// (ChatBubble's plain-text children) instead of through MarkdownAtomRenderer
// — the same "never wired through the shared KaTeX pipeline" bug class this
// repo has hit and fixed on every OTHER surface (trap rows, guided_walkthrough
// prompts, solution_steps panels, practice explanation panels). Also: the
// backend's SSE 'reasoner'/'atom' events already carry the concept id this
// answer is about, but the frontend silently dropped both event types.
function sseReaderFrom(events: Array<Record<string, unknown>>) {
  const bytes = new TextEncoder().encode(
    events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''),
  );
  let sent = false;
  return {
    read: vi.fn().mockImplementation(async () => {
      if (sent) return { done: true, value: undefined };
      sent = true;
      return { done: false, value: bytes };
    }),
  };
}

function mockChatFetch(streamEvents: Array<Record<string, unknown>>) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (!init?.method) {
      // GET /api/chat/:sessionId — empty history, so no earlier-visit noise.
      return Promise.resolve({ ok: true, json: async () => ({ messages: [] }) });
    }
    // POST /api/chat — the streamed reply.
    return Promise.resolve({ ok: true, body: { getReader: () => sseReaderFrom(streamEvents) } });
  }) as any;
}

async function sendChatMessage(text: string) {
  const input = screen.getByPlaceholderText(/ask anything about your exam/i);
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /send message/i }));
}

describe('ChatPage — tutor response rendering', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('typesets LaTeX in the assistant reply instead of leaking raw $...$ / \\begin{pmatrix} source', async () => {
    global.fetch = mockChatFetch([
      { type: 'chunk', content: 'The matrix is $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$.' },
      { type: 'done' },
    ]);

    renderChatPage();
    await sendChatMessage('Explain this matrix');

    await waitFor(() => expect(document.querySelector('.katex')).toBeTruthy());
    // The VISIBLE rendering must not show raw LaTeX source. KaTeX also emits
    // a hidden `.katex-mathml` accessibility annotation that legitimately
    // contains the source (for screen readers) — that's correct KaTeX
    // output, not the bug; only `.katex-html` (what a sighted student sees)
    // is checked here.
    const visible = document.querySelector('.katex-html');
    expect(visible).toBeTruthy();
    expect(visible!.textContent).not.toMatch(/\\begin\{pmatrix\}/);
  });

  it('surfaces the concept a reply is about from the reasoner SSE event (was silently dropped)', async () => {
    global.fetch = mockChatFetch([
      { type: 'reasoner', concept: 'matrix-operations', action: 'explain' },
      { type: 'chunk', content: 'Matrices combine like this.' },
      { type: 'done' },
    ]);

    renderChatPage();
    await sendChatMessage('Explain matrix operations');

    await waitFor(() => expect(screen.getByTestId('chat-concept-label')).toHaveTextContent('Matrix Operations'));
    expect(screen.getByText('Matrices combine like this.')).toBeInTheDocument();
  });

  it('surfaces the concept from an atom-served reply the same way', async () => {
    global.fetch = mockChatFetch([
      { type: 'atom', concept: 'eigenvalues', atomType: 'hook' },
      { type: 'chunk', content: 'An eigenvalue tells you the stretch factor.' },
      { type: 'done' },
    ]);

    renderChatPage();
    await sendChatMessage('Explain eigenvalues');

    await waitFor(() => expect(screen.getByTestId('chat-concept-label')).toHaveTextContent('Eigenvalues'));
  });

  it('renders no concept label when the backend sends none (no fabricated context)', async () => {
    global.fetch = mockChatFetch([
      { type: 'chunk', content: 'A general study-strategy answer.' },
      { type: 'done' },
    ]);

    renderChatPage();
    await sendChatMessage('How should I plan my week?');

    await waitFor(() => expect(screen.getByText('A general study-strategy answer.')).toBeInTheDocument());
    // No concept was sent, so no label should be invented.
    expect(screen.queryByTestId('chat-concept-label')).not.toBeInTheDocument();
  });
});
