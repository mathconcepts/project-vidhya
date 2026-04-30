/**
 * Retention email template rebrand tests.
 *
 * Iron rule: no email template, subject, or CTA may contain "GATE Math".
 * The v3.0 rebrand renamed the product to Vidhya; v4.0 fixed the email
 * surface that was missed. Regression guard.
 */

import { describe, it, expect } from 'vitest';
import { renderEmailTemplate } from '../../../jobs/retention-engine';

describe('renderEmailTemplate — brand', () => {
  const ALL_TEMPLATES = [
    { name: 'welcome_day0', payload: {} },
    { name: 'welcome_day3', payload: {} },
    { name: 'welcome_day7', payload: { problems_solved: 12 } },
    { name: 'streak_reminder', payload: { streak_count: 5 } },
    { name: 'weekly_digest', payload: { problems_solved: 7, accuracy: 80, streak: 3 } },
    { name: 'unknown_template', payload: {} }, // default branch
  ];

  for (const t of ALL_TEMPLATES) {
    it(`${t.name} — subject and html never mention "GATE Math" or "gatemath"`, () => {
      const out = renderEmailTemplate(t.name, t.payload);
      expect(out.subject).not.toContain('GATE Math');
      expect(out.html).not.toContain('GATE Math');
      expect(out.html).not.toContain('gatemath');
    });

    it(`${t.name} — subject mentions "Vidhya" (or is the streak reminder)`, () => {
      const out = renderEmailTemplate(t.name, t.payload);
      // streak_reminder uses "5 days" not the brand. Acceptable — utility tone.
      if (t.name === 'streak_reminder') {
        expect(out.subject).toMatch(/days?/i);
      } else {
        expect(out.subject).toContain('Vidhya');
      }
    });
  }

  it('welcome_day3 CTA links to /planned (not /)', () => {
    const out = renderEmailTemplate('welcome_day3', {});
    // The CTA href in the template body must include /planned
    expect(out.html).toMatch(/href="[^"]*\/planned"/);
  });

  it('streak_reminder interpolates the streak count', () => {
    const out = renderEmailTemplate('streak_reminder', { streak_count: 7 });
    expect(out.subject).toContain('7');
    expect(out.html).toContain('7 days');
  });

  it('weekly_digest renders with stat fields', () => {
    const out = renderEmailTemplate('weekly_digest', {
      problems_solved: 12,
      accuracy: 78,
      streak: 4,
    });
    expect(out.html).toContain('12');
    expect(out.html).toContain('78');
    expect(out.html).toContain('4');
  });
});
