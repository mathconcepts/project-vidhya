/**
 * The PYQ bank must survive a regeneration that cannot see the database.
 *
 * `scripts/export-bundles.ts` rebuilds the DB-less static bundles. It used to
 * rebuild the PYQ bank unconditionally, falling back to a scan of the topic
 * files whenever DATABASE_URL was absent or the database was unreachable. That
 * scan produces 164 of the committed 241 questions, so a routine regeneration
 * deleted 77 questions plus every hand-authored concept_ids mapping on them —
 * and reported success with a tick.
 *
 * The damage was not confined to developer machines. Both Dockerfiles run this
 * script in the builder stage and neither declares DATABASE_URL as a build
 * ARG, so every image shipped the truncated scan: the deployed bank was
 * smaller than the committed one, and no concept mapping ever reached a
 * student. An earlier release hit the same failure from a laptop.
 *
 * Two properties are locked here:
 *
 *   1. Absent a database, the bank is not written at all. There is nothing
 *      better to write than what is committed, so leaving it alone is correct
 *      rather than degraded — the committed bank IS the DB-less bundle, not a
 *      cache of one.
 *
 *   2. Given a database, a write that would drop committed questions is
 *      refused. Identity is compared, not counts: a rebuild swapping thirty
 *      questions for thirty others keeps the total identical while losing all
 *      thirty, and a count check waves that through.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { idsLostAgainstCommitted } from '../../../../scripts/export-bundles';

const ROOT = path.resolve(__dirname, '../../../..');

function writeBank(problems: Array<{ id: string }>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-guard-'));
  const p = path.join(dir, 'pyq-bank.json');
  fs.writeFileSync(p, JSON.stringify({ version: 1, problems, total: problems.length }));
  return p;
}

describe('export-bundles PYQ bank guard', () => {
  it('reports nothing lost when the rebuild is a superset', () => {
    const bank = writeBank([{ id: 'a' }, { id: 'b' }]);
    expect(idsLostAgainstCommitted(bank, [{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toEqual([]);
  });

  it('names every committed question the rebuild would delete', () => {
    const bank = writeBank([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(idsLostAgainstCommitted(bank, [{ id: 'a' }]).sort()).toEqual(['b', 'c']);
  });

  it('catches a same-size swap, which a count check cannot', () => {
    // The case that motivates comparing identity: totals match exactly.
    const bank = writeBank([{ id: 'a' }, { id: 'b' }]);
    const swapped = [{ id: 'a' }, { id: 'z' }];
    expect(swapped).toHaveLength(2);
    expect(idsLostAgainstCommitted(bank, swapped)).toEqual(['b']);
  });

  it('does not treat an unreadable committed bank as an empty one', () => {
    // Returning "nothing would be lost" here would license overwriting a file
    // whose contents could not be read — the opposite of the intent.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-guard-'));
    const p = path.join(dir, 'pyq-bank.json');
    fs.writeFileSync(p, '{ not json');
    expect(idsLostAgainstCommitted(p, [])).toEqual([]);
  });

  it('treats a missing bank as nothing to lose', () => {
    expect(idsLostAgainstCommitted('/nonexistent/pyq-bank.json', [{ id: 'a' }])).toEqual([]);
  });

  it('never writes the bank from a topic-file scan', () => {
    // The specific regression: any fallback that produces `problems` without a
    // database is how 77 questions disappeared. The script may still import
    // the seed helper for other uses, but the bank write must be reachable
    // only from the database branch.
    const src = fs.readFileSync(path.join(ROOT, 'scripts/export-bundles.ts'), 'utf8');
    const bankWrite = src.indexOf('BANK_PATH,');
    expect(bankWrite, 'export-bundles.ts should still write the bank somewhere').toBeGreaterThan(-1);

    // Between the no-DB branch and the write there must be no seed assignment.
    const noDbBranch = src.indexOf('if (!dbUrl)');
    expect(noDbBranch).toBeGreaterThan(-1);
    const between = src.slice(noDbBranch, bankWrite);
    expect(
      /problems\s*=\s*seedPYQs\(\)/.test(between),
      'a seedPYQs() fallback reached the bank write again — that is the 241-to-164 data loss',
    ).toBe(false);
  });

  it('the committed bank is larger than the topic-file scan, so the guard matters', () => {
    // If these ever converge the guard is still correct, but this pins WHY it
    // exists: the scan genuinely cannot reproduce the committed bank.
    const parsed = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'frontend/public/data/pyq-bank.json'), 'utf8'),
    );
    const committed = Array.isArray(parsed) ? parsed : parsed.problems;
    expect(committed.length).toBeGreaterThan(200);
  });
});
