import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDemoPersona,
  setDemoPersona,
  clearDemoPersona,
  applyDemoPersona,
  type DemoPersonaSignal,
} from './demoPersona';

const MEERA: DemoPersonaSignal = {
  id: 'meera-gate-la-anxious',
  display_name: 'Meera — GATE aspirant, weak in linear algebra',
  mastery_by_concept: { eigenvalues: 0.22, determinants: 0.35 },
  recent_errors: ['m_determinant_is_just_a_formula'],
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('persona round-trip', () => {
  it('stores and reads back the signal', () => {
    setDemoPersona(MEERA);
    expect(getDemoPersona()).toEqual(MEERA);
  });

  it('is absent by default', () => {
    expect(getDemoPersona()).toBeNull();
  });

  it('clears', () => {
    setDemoPersona(MEERA);
    clearDemoPersona();
    expect(getDemoPersona()).toBeNull();
  });

  it('refuses a malformed value rather than fabricating a signal', () => {
    // A half-written value must not become an empty mastery map: that would
    // compose a generic lesson while the UI still claimed a named student.
    sessionStorage.setItem('vidhya.demo.persona', '{"id":"x"}');
    expect(getDemoPersona()).toBeNull();
    sessionStorage.setItem('vidhya.demo.persona', 'not json');
    expect(getDemoPersona()).toBeNull();
  });
});

describe('applyDemoPersona', () => {
  it('is a no-op outside a demo journey', () => {
    // The normal student path must be byte-identical when no persona is set.
    const student = { session_id: 's1', mastery_by_concept: { limits: 0.9 } };
    expect(applyDemoPersona(student)).toBe(student);
  });

  it('feeds the persona mastery to the composer', () => {
    setDemoPersona(MEERA);
    const out = applyDemoPersona({ session_id: 's1' });
    expect(out.mastery_by_concept).toMatchObject({ eigenvalues: 0.22, determinants: 0.35 });
    expect(out.recent_errors).toEqual(['m_determinant_is_just_a_formula']);
  });

  it('overrides local signal so a previous visitor cannot leak into this lesson', () => {
    // The decisive property on a shared demo device. Local GBrain stores hold
    // whatever the last visitor did; the persona must win.
    setDemoPersona(MEERA);
    const out = applyDemoPersona({
      session_id: 's1',
      mastery_by_concept: { eigenvalues: 0.95 },
      recent_errors: ['someone_elses_mistake'],
    });
    expect((out.mastery_by_concept as Record<string, number>).eigenvalues).toBe(0.22);
    expect(out.recent_errors).not.toContain('someone_elses_mistake');
  });

  it('keeps local concepts the persona says nothing about', () => {
    setDemoPersona(MEERA);
    const out = applyDemoPersona({ session_id: 's1', mastery_by_concept: { limits: 0.7 } });
    expect((out.mastery_by_concept as Record<string, number>).limits).toBe(0.7);
  });

  it('falls back to local errors when the persona declares none', () => {
    setDemoPersona({ ...MEERA, recent_errors: [] });
    const out = applyDemoPersona({ session_id: 's1', recent_errors: ['local'] });
    expect(out.recent_errors).toEqual(['local']);
  });
});

describe('isolation invariants', () => {
  it('lives only in sessionStorage, so isolation is per-tab and reset clears it', () => {
    // Per-tab isolation and the existing DemoRoleSwitcher reset button both
    // fall out of this one fact. If the key ever moves to localStorage, two
    // visitors on one device share a persona and reset stops working.
    setDemoPersona(MEERA);
    expect(sessionStorage.getItem('vidhya.demo.persona')).toBeTruthy();
    expect(localStorage.getItem('vidhya.demo.persona')).toBeNull();
  });

  it('never writes anywhere a real student record could live', () => {
    // The plan's item 7 requires demo sessions not to reach real student-data
    // tables. Here that holds by construction rather than by a guard: the
    // signal rides the client-supplied compose input and is never persisted
    // server-side at all.
    setDemoPersona(MEERA);
    applyDemoPersona({ session_id: 's1' });
    expect(Object.keys(localStorage)).toHaveLength(0);
  });
});
