/**
 * Receipt invariant — CI guard on DESIGN-SYSTEM.md's receipt-border law.
 *
 * The law says the border only ever appears over content backed by a real
 * verification record. Before this guard, `{ verified: true }` satisfied the
 * type and nothing stopped a call site minting the promise out of nothing —
 * which is how SpinePage came to draw the border over self-reported
 * spaced-repetition counts and label them "verified attempts".
 *
 * Making `source` required raises the cost of that mistake but does not
 * eliminate it: `{ verified: true, source: 'looks_official' }` still compiles.
 * This test closes the remaining gap by refusing any receipt object literal
 * outside `lib/receipt.ts`, so the only way to obtain one is a constructor that
 * demands a backing record.
 *
 * Same shape as the backend's surveillance invariants: a source-text rule the
 * type system cannot express, enforced in CI rather than in review.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..');

/** Only these may contain a receipt literal, and only for the reasons given. */
const ALLOWED = new Set([
  // The constructors themselves — the one sanctioned mint.
  'lib/receipt.ts',
  // Tests legitimately construct receipts to exercise the renderer.
  'lib/receipt.test.ts',
  'lib/receipt.invariant.test.ts',
  'components/ui/ReceiptBorder.test.tsx',
]);

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

describe('receipt-border law', () => {
  it('no receipt object literal exists outside the constructors', () => {
    // Anchored on the receipt CONTEXT (a `receipt=` prop or a `Receipt`-typed
    // binding) rather than on `verified: true` alone. That field name is common
    // on unrelated records — generated problems carry their own `verified`
    // flag — and matching it bare produced false positives that would have
    // trained people to add exemptions until the guard meant nothing.
    const LITERAL = /receipt\s*=\s*\{\{|:\s*Receipt\s*=\s*\{|as\s+Receipt\b/;
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
      const rel = path.relative(SRC, file).split(path.sep).join('/');
      if (ALLOWED.has(rel)) continue;
      // Strip comments first, so prose describing the rule cannot violate it.
      const lines = fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((l) => l.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, ''));
      const hit = lines.findIndex((l) => LITERAL.test(l));
      if (hit >= 0) offenders.push(`${rel}:${hit + 1}`);
    }

    expect(
      offenders,
      `Receipt literals found. A receipt must be minted from a backing record via\n` +
        `receiptFromVerification() / receiptFromServerGrade() in lib/receipt.ts, or be\n` +
        `NO_RECEIPT. Writing one by hand re-opens the hole where the border promises\n` +
        `"proven true" over data nothing verified:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });

  it('the Receipt type still requires a source', () => {
    // If `source` ever goes optional again, `{ verified: true }` type-checks at
    // every call site and the guard above becomes the only thing standing.
    const src = fs.readFileSync(path.join(SRC, 'lib/receipt.ts'), 'utf8');
    expect(src).toMatch(/source:\s*string;/);
    expect(src).not.toMatch(/source\?:\s*string/);
  });
});
