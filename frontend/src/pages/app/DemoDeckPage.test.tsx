/**
 * DemoDeckPage tests.
 *
 * The states are the feature here. This screen is the first thing a visitor —
 * including a principal who came to judge whether the product is real — sees,
 * so every failure mode has to say something true rather than render a blank
 * or a generic error.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DemoDeckPage, { railDestination, railSteps, entryHref, type DemoCard } from './DemoDeckPage';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const CARD: DemoCard = {
  id: 'gate-3-weeks-weak-la',
  title: 'Three weeks to GATE, weak in linear algebra',
  subtitle: 'Meera has been avoiding the topic she is weakest at.',
  audience: 'student',
  persona: 'meera-gate-la-anxious',
  rail: { kind: 'atoms', concept_id: 'eigenvalues', atoms: ['hook', 'intuition'] },
};

function stubFetch(impl: () => Promise<any>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DemoDeckPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  navigate.mockReset();
});

describe('railDestination', () => {
  it('sends an atoms rail to the concept lesson', () => {
    expect(railDestination(CARD)).toBe('/lesson/eigenvalues');
  });

  it('sends a compare rail to the existing side-by-side surface', () => {
    // The personalized-vs-neutral comparison already exists at /admin/scenarios;
    // the deck points at it rather than rebuilding it.
    expect(
      railDestination({
        ...CARD,
        rail: { kind: 'compare', concept_id: 'linear-transformations', against_persona: 'x' },
      }),
    ).toBe('/admin/scenarios');
  });
});

describe('DemoDeckPage states', () => {
  it('lists each journey with its subtitle', async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ cards: [CARD] }) }));
    renderPage();
    expect(await screen.findByText(CARD.title)).toBeInTheDocument();
    expect(screen.getByText(CARD.subtitle!)).toBeInTheDocument();
  });

  it('signs in as the persona on the way into the rail', async () => {
    // A gradable step needs an authenticated session, and the account must be
    // the person the captions name — otherwise the rail narrates Meera while
    // recording against someone else.
    const assign = vi.fn();
    vi.stubGlobal('location', { assign } as unknown as Location);
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ cards: [CARD] }) }));
    renderPage();
    await userEvent.click(await screen.findByText(CARD.title));
    expect(assign).toHaveBeenCalledWith(
      '/demo-login?role=meera-gate-la-anxious&next=%2Flesson%2Feigenvalues',
    );
  });

  it('says demo mode is off on a 404 rather than showing a generic error', async () => {
    // The operator is standing next to the machine. The message has to name the
    // actual cause and the actual fix, not "something went wrong".
    stubFetch(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    renderPage();
    expect(await screen.findByText(/demo mode is off/i)).toBeInTheDocument();
    expect(screen.getByText(/DEMO_MODE_ENABLED=true/)).toBeInTheDocument();
  });

  it('surfaces the server reason when the deck cannot be read', async () => {
    stubFetch(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: 'demo rails config contains no cards' }),
    }));
    renderPage();
    expect(await screen.findByText(/contains no cards/)).toBeInTheDocument();
  });

  it('surfaces a network failure instead of hanging on the loading state', async () => {
    stubFetch(async () => {
      throw new Error('offline');
    });
    renderPage();
    expect(await screen.findByText(/Could not load the journeys: offline/)).toBeInTheDocument();
  });

  it('shows a loading state before the deck arrives', async () => {
    stubFetch(() => new Promise(() => {}));
    renderPage();
    await waitFor(() => expect(screen.getByText('Loading…')).toBeInTheDocument());
  });

  it('claims nothing about the product in its own copy', async () => {
    // The demo's standing law is that it never oversells. The entry screen is
    // the easiest place for marketing voice to creep in.
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ cards: [CARD] }) }));
    const { container } = renderPage();
    await screen.findByText(CARD.title);
    const text = container.textContent ?? '';
    for (const word of ['revolutionary', 'powerful', 'amazing', 'seamless', 'best-in-class']) {
      expect(text.toLowerCase()).not.toContain(word);
    }
  });
});

describe('railSteps', () => {
  it('turns a practice item into a final step after the lesson', () => {
    // Reuses DemoRailNav rather than growing a second navigation mechanism.
    expect(
      railSteps({ ...CARD, rail: { ...CARD.rail, practice_item_id: 'la-eigen-trace-det-001' } as never }),
    ).toEqual([
      { at: 'lesson', route: '/lesson/eigenvalues', label: 'The concept' },
      { at: 'practice', route: '/attempt/la-eigen-trace-det-001', label: 'Try one yourself' },
    ]);
  });

  it('has no steps when the rail ends on the lesson', () => {
    expect(railSteps(CARD)).toEqual([]);
  });
});

describe('entryHref', () => {
  it('encodes the return path so the visitor lands on the rail, not the home page', () => {
    expect(entryHref(CARD)).toBe(
      '/demo-login?role=meera-gate-la-anxious&next=%2Flesson%2Feigenvalues',
    );
  });
});
