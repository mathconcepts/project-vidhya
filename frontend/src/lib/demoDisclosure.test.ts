/**
 * Demo disclosure invariant.
 *
 * SampleDataChip's own rule: "Never render it over real data, and never render
 * real data without it once a view is in seeded-role mode."
 *
 * That rule had a hole. `SEEDED_ROLES` is {teacher, parent, admin} — student is
 * deliberately excluded on the theory that a student view is "the real engine
 * on real data". That was true when it was written. It stopped being true when
 * demo journeys began composing a student's lesson from a persona's FIXTURE
 * mastery: the surface now shows synthetic learning state with no disclosure,
 * which is the one thing the demo's honesty law does not permit.
 *
 * This locks the fix at the source level rather than through a render test,
 * because the property that matters is "the lesson surface discloses whenever a
 * persona is driving it" — a claim about the code, not about one snapshot.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

describe('demo disclosure', () => {
  it('the lesson page discloses fixture data whenever a persona drives it', () => {
    const lesson = read('pages/app/LessonPage.tsx');
    expect(lesson).toContain('SampleDataChip');
    // Gated on the persona, not on a role: the persona is what makes the
    // mastery synthetic, and role-based gating is precisely what missed this.
    expect(lesson).toMatch(/getDemoPersona\(\)\s*&&\s*<SampleDataChip/);
  });

  it('the chip still refuses to be a decoration', () => {
    // If it ever renders unconditionally it stops carrying information, and a
    // label that is always on is a label that says nothing.
    const chip = read('components/app/SampleDataChip.tsx');
    expect(chip).toContain('aria-label');
    expect(chip.toLowerCase()).toContain('sample data');
  });

  it('persona mastery never reaches a real student surface unlabelled', () => {
    // applyDemoPersona is the only path fixture mastery takes into a lesson.
    // Any new call site must be accompanied by a disclosure; today the lesson
    // page is the sole consumer, and it discloses.
    const consumers = walk(SRC).filter(
      (f) => /applyDemoPersona\(/.test(fs.readFileSync(f, 'utf8')) && !/demoPersona/.test(f),
    );
    for (const file of consumers) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text, `${path.relative(SRC, file)} applies persona mastery`).toContain(
        'SampleDataChip',
      );
    }
  });
});

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}
