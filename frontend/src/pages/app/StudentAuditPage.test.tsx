/**
 * StudentAuditPage.test.tsx
 *
 * Locks the weak-prerequisite -> wizard follow-up (2026-09-04): the
 * teacher-facing "Foundation Alerts" card gains a "Method-selection wizard
 * available" link when the backend resolves one, and stays exactly as it
 * was when it doesn't.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useSession', () => ({ useSession: () => 'session-1' }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

const BASE_REPORT = {
  session_id: 'session-1',
  generated_at: new Date().toISOString(),
  executive_summary: {
    predicted_score_range: '40-55 marks',
    readiness_level: 'building' as const,
    biggest_risk: 'Linear Algebra at 30%',
    top_strength: 'Calculus at 70%',
  },
  mastery_heatmap: [],
  error_analysis: { total_errors: 0, dominant_type: 'none', trend: 'stable', top_misconceptions: [], recommendations: [] },
  cognitive_profile: { representation_mode: 'visual', abstraction_comfort: 0.5, working_memory_est: 0.5, narrative: '' },
  motivation_trajectory: { current_state: 'steady', consecutive_failures: 0, narrative: '' },
  strategic_recommendations: [],
  action_plan: [],
};

function mockApiFetch(prerequisiteAlerts: Array<{ concept: string; severity: string; fix_order: string[]; wizard_route: string | null }>) {
  // vi.doMock only affects modules not yet imported in this test file's
  // run — each test re-imports StudentAuditPage (and its @/hooks/useApi
  // dependency) fresh, so the module cache must be reset first or a later
  // test silently keeps the first test's mocked response.
  vi.resetModules();
  vi.doMock('@/hooks/useApi', () => ({
    apiFetch: vi.fn().mockResolvedValue({ report: { ...BASE_REPORT, prerequisite_alerts: prerequisiteAlerts } }),
  }));
}

async function renderPage() {
  const Page = (await import('./StudentAuditPage')).default;
  return render(<MemoryRouter><Page /></MemoryRouter>);
}

describe('StudentAuditPage — foundation-alert wizard link', () => {
  it('shows the wizard link when the backend resolves one for the alerted concept', async () => {
    mockApiFetch([{ concept: 'diagonalization', severity: 'critical', fix_order: ['eigenvalues'], wizard_route: '/theorem-wizard/linear-algebra?concept=diagonalization' }]);
    await renderPage();
    const link = await screen.findByRole('link', { name: /Method-selection wizard available for diagonalization/ });
    expect(link).toHaveAttribute('href', '/theorem-wizard/linear-algebra?concept=diagonalization');
  });

  it('omits the wizard link when the backend resolves none', async () => {
    mockApiFetch([{ concept: 'vector-spaces', severity: 'warning', fix_order: ['linear-independence'], wizard_route: null }]);
    await renderPage();
    await waitFor(() => expect(screen.getByText(/Fix order: linear independence/)).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Method-selection wizard available/ })).not.toBeInTheDocument();
  });
});
