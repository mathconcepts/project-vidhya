import { describe, it, expect, beforeEach } from 'vitest';
import { getExamChoice, storeExamChoice, withExamChoice } from './exam-choice';

describe('exam-choice', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* ignore */ } });

  it('follows the deployment default when nothing is stored', () => {
    expect(getExamChoice()).toBeNull();
    expect(withExamChoice('/api/topics')).toBe('/api/topics');
  });

  it('round-trips a choice and clears it', () => {
    storeExamChoice('jee-main');
    expect(getExamChoice()).toBe('jee-main');
    storeExamChoice(null);
    expect(getExamChoice()).toBeNull();
  });

  it('appends the choice with the right separator', () => {
    storeExamChoice('jee-main');
    expect(withExamChoice('/api/topics')).toBe('/api/topics?exam_id=jee-main');
    expect(withExamChoice('/api/topics?x=1')).toBe('/api/topics?x=1&exam_id=jee-main');
  });

  it('never overrides an explicit per-call exam_id', () => {
    storeExamChoice('jee-main');
    // An intentional override at the call site has to win — otherwise an
    // admin page pinned to one exam would silently follow the viewer's chip.
    expect(withExamChoice('/api/topics?exam_id=gate-ma')).toBe('/api/topics?exam_id=gate-ma');
  });

  it('url-encodes, so a hostile id cannot forge another query param', () => {
    storeExamChoice('a&role=admin');
    expect(withExamChoice('/api/topics')).toBe('/api/topics?exam_id=a%26role%3Dadmin');
  });

  it('treats a blank stored value as no choice', () => {
    storeExamChoice('   ');
    expect(getExamChoice()).toBeNull();
  });
});
