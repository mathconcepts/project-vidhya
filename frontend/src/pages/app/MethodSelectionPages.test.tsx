/**
 * MethodSelectionPages.test.tsx
 *
 * The two shipped wizards after the D2 migration: TheoremWizardPage and
 * DistributionSelectorPage are now thin shells over the shared branching
 * `guided_walkthrough` renderer. These tests are behavioural — they walk
 * each page the way a student would and check that the page still is what
 * it was (its title, its subject matter, its unknown-module refusal) and
 * that it now carries the self-check honesty label it did not have before.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TheoremWizardPage from './TheoremWizardPage';
import DistributionSelectorPage from './DistributionSelectorPage';
import { SELF_CHECK_LABEL } from '@/components/lesson/interactives/DecisionTreeWalkthrough';

function renderWizard(moduleId: string, search = '') {
  return render(
    <MemoryRouter initialEntries={[`/theorem-wizard/${moduleId}${search}`]}>
      <Routes>
        <Route path="/theorem-wizard/:module" element={<TheoremWizardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TheoremWizardPage', () => {
  it('renders the vector-calculus trainer and walks to the sanctioned leaf', () => {
    renderWizard('vector-calculus');
    expect(
      screen.getByRole('heading', { name: 'Which Vector Calculus Theorem Applies?' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'A closed curve C' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Flat in the xy-plane, bounding a region D' }),
    );
    fireEvent.click(screen.getByRole('button', { name: "Green's theorem" }));

    const leaf = screen.getByTestId('decision-leaf');
    expect(leaf.getAttribute('data-best')).toBe('true');
    expect(leaf).toHaveTextContent('Use it when the curve is closed, simple');
  });

  it('walks a plausible wrong theorem to its dead end instead of blocking it', () => {
    renderWizard('vector-calculus');
    fireEvent.click(screen.getByRole('button', { name: 'A surface S' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Closed: it encloses a solid (a sphere, a box)' }),
    );
    fireEvent.click(screen.getByRole('button', { name: "Stokes' theorem" }));

    const leaf = screen.getByTestId('decision-leaf');
    expect(leaf.getAttribute('data-best')).toBe('false');
    expect(leaf).toHaveTextContent('Stokes needs a boundary curve');
    expect(leaf.outerHTML).not.toContain('--red');
  });

  it('renders the linear-algebra trainer with all four of its old subjects reachable', () => {
    renderWizard('linear-algebra');
    expect(
      screen.getByRole('heading', { name: 'Which Linear Algebra Theorem Applies?' }),
    ).toBeInTheDocument();
    for (const label of [
      'Whether A is invertible',
      'Whether a linear map is injective',
      'A high power such as A¹⁰⁰',
      'The sign of a quadratic form xᵀAx',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('button', { name: 'A high power such as A¹⁰⁰' }));
    fireEvent.click(screen.getByRole('button', { name: 'A is diagonalisable — A = PDP⁻¹' }));
    expect(screen.getByTestId('decision-leaf')).toHaveTextContent('Cayley-Hamilton');
  });

  it('still refuses an unknown module by name', () => {
    renderWizard('astrophysics');
    expect(
      screen.getByText('No theorem wizard available for module "astrophysics" yet.'),
    ).toBeInTheDocument();
  });

  it('carries the self-check honesty label', () => {
    renderWizard('vector-calculus');
    expect(screen.getByText(SELF_CHECK_LABEL)).toBeInTheDocument();
  });

  // Regression (/investigate, 2026-09-03): "the walkthrough decision tree
  // ... must help them connect to the concept in the problem" — arriving
  // here with no context read as a disconnected generic tool.
  describe('context from a wrong practice answer', () => {
    it('shows no context banner or practice CTA when opened directly (no query params)', () => {
      renderWizard('vector-calculus');
      expect(screen.queryByText(/You got a/)).toBeNull();
      expect(screen.queryByText('Practice more like this')).toBeNull();
    });

    it('names the concept and mistake when arriving from a wrong answer', () => {
      renderWizard('vector-calculus', '?concept=greens-theorem&mistake=picking%20the%20wrong%20approach');
      expect(
        screen.getByText((_, node) => node?.textContent === 'You got a greens theorem question wrong — picking the wrong approach. Work through the questions below to find where the mix-up happened.'),
      ).toBeInTheDocument();
    });

    it('shows the concept-scoped practice CTA regardless of whether a leaf has been reached', () => {
      renderWizard('vector-calculus', '?concept=greens-theorem');
      const cta = screen.getByRole('link', { name: /practice more like this/i });
      expect(cta).toHaveAttribute('href', '/smart-practice?concept=greens-theorem');
    });
  });
});

describe('DistributionSelectorPage', () => {
  function renderPage(search = '') {
    return render(
      <MemoryRouter initialEntries={[`/distribution-selector${search}`]}>
        <DistributionSelectorPage />
      </MemoryRouter>,
    );
  }

  it('renders the trainer and classifies down to the sanctioned distribution', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Which Probability Distribution?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'A count of occurrences' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'A known average rate over a fixed interval, with no fixed number of trials',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Poisson(λ=8)' }));

    const leaf = screen.getByTestId('decision-leaf');
    expect(leaf.getAttribute('data-best')).toBe('true');
    expect(leaf).toHaveTextContent('P(X=k) = e^{−λ} λ^k / k!');
  });

  it('walks the binomial-vs-Poisson confusion to its dead end and back', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'A count of occurrences' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'A fixed number n of independent trials, each with the same probability p',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Poisson(λ = np = 1)' }));

    const leaf = screen.getByTestId('decision-leaf');
    expect(leaf.getAttribute('data-best')).toBe('false');
    expect(leaf).toHaveTextContent('take the exact answer when it is offered');

    fireEvent.click(screen.getByRole('button', { name: /walk back/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Binomial(n=50, p=0.02)' }));
    expect(screen.getByTestId('decision-leaf').getAttribute('data-best')).toBe('true');
  });

  it('carries the self-check honesty label', () => {
    renderPage();
    expect(screen.getByText(SELF_CHECK_LABEL)).toBeInTheDocument();
  });

  it('fires no request while the student classifies — nothing is graded', () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('no network from a self-check widget')));
    vi.stubGlobal('fetch', fetchSpy);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'A continuous measurement — time, length, a score' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'A lifetime or waiting time with no memory of how long it has run',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Exponential(λ=1/200)' }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  describe('context from a wrong practice answer', () => {
    it('shows no context banner or practice CTA when opened directly (no query params)', () => {
      renderPage();
      expect(screen.queryByText(/You got a/)).toBeNull();
      expect(screen.queryByText('Practice more like this')).toBeNull();
    });

    it('shows the concept-scoped practice CTA when arriving from a wrong answer', () => {
      renderPage('?concept=binomial-distribution&mistake=picking%20the%20wrong%20approach');
      expect(screen.getByText(/binomial distribution/)).toBeInTheDocument();
      const cta = screen.getByRole('link', { name: /practice more like this/i });
      expect(cta).toHaveAttribute('href', '/smart-practice?concept=binomial-distribution');
    });
  });
});
