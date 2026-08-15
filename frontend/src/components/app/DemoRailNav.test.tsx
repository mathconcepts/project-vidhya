import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DemoRailNav } from './DemoRailNav';
import {
  setDemoPersona,
  setDemoCaptions,
  setDemoRail,
  clearDemoPersona,
  railPosition,
} from '@/lib/demoPersona';

const navigate = vi.fn();
let pathname = '/teaching';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate, useLocation: () => ({ pathname }) };
});

const STEPS = [
  { at: 'batch', route: '/teaching', label: 'Batch view' },
  { at: 'coverage', route: '/teacher/syllabus-coverage', label: 'Taught vs mastered' },
  { at: 'attempts', route: '/progress', label: 'Individual attempts' },
];

function enterRail() {
  setDemoPersona({
    id: 'meera-gate-la-anxious',
    display_name: 'Meera',
    mastery_by_concept: { eigenvalues: 0.22 },
    recent_errors: [],
  });
  setDemoRail(STEPS);
  setDemoCaptions([{ at: 'batch', text: 'Every number on this screen is tappable.' }]);
}

const renderNav = () =>
  render(
    <MemoryRouter>
      <DemoRailNav />
    </MemoryRouter>,
  );

beforeEach(() => {
  sessionStorage.clear();
  pathname = '/teaching';
});
afterEach(() => {
  navigate.mockReset();
});

describe('railPosition', () => {
  it('derives position from the path, not from held state', () => {
    // Matching on the route is what keeps the browser back button and a
    // mid-rail reload correct instead of off by one.
    enterRail();
    expect(railPosition('/teacher/syllabus-coverage')).toMatchObject({
      index: 1,
      total: 3,
      next: STEPS[2],
    });
  });

  it('reports no position for a path outside the rail', () => {
    enterRail();
    expect(railPosition('/somewhere-else').current).toBeNull();
  });

  it('has no next at the end of the rail', () => {
    enterRail();
    expect(railPosition('/progress').next).toBeNull();
  });
});

describe('DemoRailNav', () => {
  it('renders nothing outside a demo journey', () => {
    clearDemoPersona();
    const { container } = renderNav();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the visitor wanders off the rail', () => {
    // Not narrated, and NOT pushed back — the rail never traps anyone.
    enterRail();
    pathname = '/settings';
    const { container } = renderNav();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows position, the step label and its caption', () => {
    enterRail();
    renderNav();
    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText(/Batch view/)).toBeInTheDocument();
    expect(screen.getByText(/Every number on this screen is tappable/)).toBeInTheDocument();
  });

  it('advances to the next surface', async () => {
    enterRail();
    renderNav();
    await userEvent.click(screen.getByText(/Next: Taught vs mastered/));
    expect(navigate).toHaveBeenCalledWith('/teacher/syllabus-coverage');
  });

  it('says the journey ended rather than leaving a dead control', () => {
    enterRail();
    pathname = '/progress';
    renderNav();
    expect(screen.getByText(/End of this journey/)).toBeInTheDocument();
    expect(screen.queryByText(/^Next:/)).not.toBeInTheDocument();
  });

  it('still shows the step when that step has no caption', () => {
    // Captions are garnish; the rail must remain walkable without them.
    enterRail();
    setDemoCaptions([]);
    pathname = '/teacher/syllabus-coverage';
    renderNav();
    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
    expect(screen.getByText(/Next: Individual attempts/)).toBeInTheDocument();
  });
});
