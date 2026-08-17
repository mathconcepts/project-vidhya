/**
 * The two prose counters must agree.
 *
 * There are deliberately two implementations. `src/content/prose-budget.ts` is
 * the canonical one, used by the CI gate and by the cadence that tells the
 * generator its limit. `frontend/src/lib/readingTime.ts` has its own, because
 * the frontend is a separate compilation unit and `tsconfig.json` sets
 * `rootDir: ./src` — a source file under `src/` that imports from `frontend/`
 * fails the build. The first attempt at sharing one implementation did exactly
 * that and broke CI.
 *
 * Duplication was the only option; silent duplication was not. If the gate
 * counts 198 words and the card counts something else, a CI failure becomes
 * impossible to reproduce by looking at the page. This test is the seam.
 *
 * A test file may cross the boundary that source files cannot, because
 * tsconfig excludes tests from the typecheck.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { countProseWords as backend } from '../prose-budget';
import { countProseWords as frontend } from '../../../frontend/src/lib/readingTime';

const CASES: Array<[string, string]> = [
  ['plain prose', 'one two three four five'],
  ['inline maths', 'the value $x = 3$ is small'],
  ['display maths', 'before\n\n$$A - \\lambda I = 0$$\n\nafter'],
  [
    'a fenced interactive spec',
    'lead in\n\n```interactive-spec\n{"v":1,"kind":"manipulable","title":"a long title with many words in it"}\n```\n\ntail',
  ],
  ['two fenced blocks', '```a\nx y z\n```\nmiddle\n```b\np q r\n```'],
  ['an unterminated fence', 'start\n\n```interactive-spec\n{"v":1}\n\nno closing fence'],
  ['headings and emphasis', '## A heading\n\n**bold** and _italic_ words'],
  ['empty', ''],
  ['whitespace only', '   \n\n  \t '],
  [
    'maths-dense, prose-thin',
    '**Step 1.** $A - \\lambda I = \\begin{pmatrix} 4-\\lambda & 1 \\\\ 2 & 3-\\lambda \\end{pmatrix}$',
  ],
];

describe('the canonical counter and the frontend counter agree', () => {
  for (const [name, body] of CASES) {
    it(`agrees on ${name}`, () => {
      expect(frontend(body)).toBe(backend(body));
    });
  }
});

describe('agreement holds on the real corpus', () => {
  const root = path.join(process.cwd(), 'modules/project-vidhya-content/concepts');

  it('agrees on every authored atom', () => {
    if (!fs.existsSync(root)) return;
    const disagreements: string[] = [];
    let checked = 0;
    for (const concept of fs.readdirSync(root)) {
      const atoms = path.join(root, concept, 'atoms');
      if (!fs.existsSync(atoms)) continue;
      for (const f of fs.readdirSync(atoms)) {
        if (!f.endsWith('.md')) continue;
        const body = matter(fs.readFileSync(path.join(atoms, f), 'utf-8')).content;
        checked++;
        const a = backend(body);
        const b = frontend(body);
        if (a !== b) disagreements.push(`${concept}/${f}: backend=${a} frontend=${b}`);
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(disagreements).toEqual([]);
  });
});
