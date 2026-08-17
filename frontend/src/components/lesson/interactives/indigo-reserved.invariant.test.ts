/**
 * indigo-reserved.invariant.test.ts
 *
 * DESIGN-SYSTEM.md: "Tutor indigo... AI, tutor, study plan. Reserved. No
 * other surface may use it." Nothing in this directory (lesson interactive
 * widgets: manipulables, simulations, guided walkthroughs, quizzes,
 * flashcards, CAS panels, graphers, verify checks) is an AI/tutor/study-plan
 * surface, so no file here may carry the indigo token or its raw literal
 * equivalents — not even a "just a little" tint.
 *
 * Same shape as lib/receipt.invariant.test.ts: a source-text rule the type
 * system can't express, enforced in CI so a future PR can't quietly bring
 * indigo back into a lesson control.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const DIR = path.resolve(__dirname, '.');

/** Raw literal equivalents of --indigo / --indigo-ink / --indigo-tint, in
 *  case a future edit hardcodes the color instead of dropping the token. */
const INDIGO_PATTERNS = [
  /var\(--indigo/,
  /rgba\(\s*88,\s*86,\s*214/,
  /#5856d6/i,
  /#4340b5/i,
  /#7d7aff/i, // dark-mode indigo
  /#a5a3ff/i, // dark-mode indigo-ink
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('reserved-indigo invariant (lesson interactives)', () => {
  it('no file in frontend/src/components/lesson/interactives uses the indigo token or its literal equivalents', () => {
    const offenders: string[] = [];
    for (const file of walk(DIR)) {
      const rel = path.relative(DIR, file).split(path.sep).join('/');
      // Test files themselves are allowed to mention the patterns in prose
      // (this file, and any other invariant/test file) — strip comments and
      // string literals used purely to document the rule, but the simplest
      // safe rule is: skip *.test.ts(x) files, since none of them render a
      // production surface.
      if (/\.test\.tsx?$/.test(rel)) continue;

      const lines = fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((l) => l.replace(/\/\/.*$/, ''));
      lines.forEach((line, i) => {
        if (INDIGO_PATTERNS.some((re) => re.test(line))) {
          offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      });
    }

    expect(
      offenders,
      `Indigo found outside an AI/tutor surface. Indigo is reserved for AI, tutor,\n` +
        `and study-plan surfaces (DESIGN-SYSTEM.md). Lesson interactive widgets get\n` +
        `neutral tokens instead (--separator, --surface-fill, --surface-fill-strong,\n` +
        `--text-secondary, --text-primary, --grey-6 for native accentColor):\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });
});
