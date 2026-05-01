import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MasteryParticle, shouldCelebrate, markCelebrated } from './MasteryParticle';

describe('MasteryParticle render', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(<MasteryParticle active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one element when active', () => {
    const { container } = render(<MasteryParticle active={true} />);
    expect(container.querySelectorAll('div').length).toBe(1);
  });
});

describe('celebration gating (per concept-per-day)', () => {
  beforeEach(() => localStorage.clear());

  it('shouldCelebrate returns true on first call', () => {
    expect(shouldCelebrate('calculus-derivatives')).toBe(true);
  });

  it('returns false after markCelebrated for the same day', () => {
    markCelebrated('calculus-derivatives');
    expect(shouldCelebrate('calculus-derivatives')).toBe(false);
  });

  it('is per-concept (other concepts still celebrate)', () => {
    markCelebrated('calculus-derivatives');
    expect(shouldCelebrate('linear-algebra-eigenvalues')).toBe(true);
  });
});
