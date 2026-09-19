import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamSwitcher, shortExamName } from './ExamSwitcher';

const setActiveExam = vi.fn();
let mockExam: unknown = null;

vi.mock('@/hooks/useActiveExam', () => ({
  useActiveExam: () => ({ exam: mockExam, loading: false, error: false }),
  setActiveExam: (id: string | null) => setActiveExam(id),
}));

const TWO = {
  exam_id: 'gate-ma',
  name: 'GATE Engineering Mathematics',
  available_exams: [
    { id: 'gate-ma', name: 'GATE Engineering Mathematics' },
    { id: 'jee-main', name: 'JEE Main (PCM)' },
  ],
};

describe('ExamSwitcher', () => {
  beforeEach(() => { setActiveExam.mockClear(); mockExam = TWO; });

  it('renders nothing on a single-pack deployment', () => {
    mockExam = { ...TWO, available_exams: [{ id: 'gate-ma', name: 'GATE Engineering Mathematics' }] };
    const { container } = render(<ExamSwitcher />);
    // A switcher offering one option is noise — every existing single-exam
    // deployment must get its header back exactly as it was.
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing before the active exam has loaded', () => {
    mockExam = null;
    const { container } = render(<ExamSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('names the current exam in its accessible label', () => {
    render(<ExamSwitcher />);
    expect(screen.getByLabelText(/Current exam: GATE Engineering Mathematics/i)).toBeTruthy();
  });

  it('opens a listbox of every loaded exam, by full name', () => {
    render(<ExamSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(2);
    // Scoped to the menu: since the chip stopped dropping words, the full
    // name legitimately appears twice on screen (chip + row).
    const rowText = opts.map(o => o.textContent);
    expect(rowText).toContain('JEE Main (PCM)');
    expect(rowText).toContain('GATE Engineering Mathematics');
  });

  it('marks the current exam selected and does not re-switch to it', () => {
    render(<ExamSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    const current = screen.getAllByRole('option').find(o => o.getAttribute('aria-selected') === 'true');
    expect(current).toBeTruthy();
    fireEvent.click(current!);
    expect(setActiveExam).not.toHaveBeenCalled();
  });

  it('switches when another exam is chosen', () => {
    render(<ExamSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('JEE Main (PCM)'));
    expect(setActiveExam).toHaveBeenCalledWith('jee-main');
  });

  it('uses NO accent colour — which exam you browse is neither mastery nor tutor', () => {
    render(<ExamSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    const html = document.body.innerHTML;
    // Clarity reserves green for mastery and indigo for AI/tutor. A green
    // tick here would read as "you have achieved this exam".
    expect(html).not.toMatch(/--green/);
    expect(html).not.toMatch(/--indigo/);
  });

  it('gives every menu row a 44px touch target', () => {
    render(<ExamSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    for (const o of screen.getAllByRole('option')) {
      expect((o as HTMLElement).style.minHeight).toBe('44px');
    }
    expect((screen.getAllByRole('button')[0] as HTMLElement).style.minHeight).toBe('44px');
  });

  it('shortExamName drops only a parenthetical — it never renames the exam', () => {
    // Dropping words produced "GATE Engineering", which reads as a complete
    // name and names the wrong subject. Width is handled by CSS ellipsis
    // instead, so a shortened name is always visibly shortened.
    expect(shortExamName('GATE Engineering Mathematics')).toBe('GATE Engineering Mathematics');
    expect(shortExamName('JEE Main (PCM)')).toBe('JEE Main');
    expect(shortExamName('BITSAT')).toBe('BITSAT');
  });

  it('truncates the chip with ellipsis rather than by dropping words', () => {
    render(<ExamSwitcher />);
    const label = screen.getByRole('button').querySelector('span') as HTMLElement;
    expect(label.style.textOverflow).toBe('ellipsis');
    expect(label.style.whiteSpace).toBe('nowrap');
    expect(label.textContent).toBe('GATE Engineering Mathematics');
  });
});
