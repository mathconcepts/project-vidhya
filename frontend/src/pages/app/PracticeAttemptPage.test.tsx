/**
 * PracticeAttemptPage — selected-state + a11y coverage (T24, §11
 * "Interaction states" a11y line: "fix the existing selected-state no-op
 * ternary, PracticeAttemptPage:296, and give selection a real
 * --surface-fill+border-color change").
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));
vi.mock('@/lib/demoPersona', () => ({ setDemoOutcome: vi.fn() }));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const MCQ_ITEM = {
  id: 'obj-1',
  node_id: 'matrix-operations',
  topic: 'Matrix operations',
  question_text: 'What is 2 + 2?',
  est_minutes: 2,
  gradable: true,
  question_type: 'mcq' as const,
  marks: 1,
  options: ['3', '4', '5'],
  marking: { marks_correct: 1, marks_wrong: 0.33 },
  not_gradable_reason: null,
};

async function renderPage() {
  const Page = (await import('./PracticeAttemptPage')).default;
  return render(
    <MemoryRouter initialEntries={['/attempt/obj-1']}>
      <Routes>
        <Route path="/attempt/:objectId" element={<Page />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PracticeAttemptPage — option selection', () => {
  it('gives the mcq options a real radiogroup/radio a11y contract', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(MCQ_ITEM));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(3);
    options.forEach((opt) => expect(opt).toHaveAttribute('aria-checked', 'false'));
  });

  it('gives a selected option a real visual change, not the former no-op ternary', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(MCQ_ITEM));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    const options = screen.getAllByRole('radio');
    const unselectedBackground = options[1].style.background;

    fireEvent.click(options[1]);

    expect(options[1]).toHaveAttribute('aria-checked', 'true');
    // The pre-fix code set the SAME value ('var(--surface-fill)') on both
    // branches of the ternary — selecting an option must now visibly change
    // both the background and the border color.
    expect(options[1].style.background).not.toBe(unselectedBackground);
    expect(options[1].style.background).toContain('surface-fill');
    expect(options[0].style.background).not.toContain('surface-fill');
  });

  it('supports arrow-key navigation across options', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(MCQ_ITEM));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    const options = screen.getAllByRole('radio');
    options[0].focus();
    expect(document.activeElement).toBe(options[0]);

    fireEvent.keyDown(options[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]);

    fireEvent.keyDown(options[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(options[0]);

    // Wraps around at the ends.
    fireEvent.keyDown(options[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(options[2]);
  });
});
