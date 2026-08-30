/**
 * Tests for src/verification/report.ts — the verification pass-rate report.
 *
 * Runs against the REAL committed data/practice-items/*.json and
 * frontend/public/data/content-bundle.json — this is the point: the report
 * must be honest about the actual repo state, not a mock's idea of it. The
 * exact numbers below are pinned to the current committed content and are
 * meant to drift with real content changes (a failing assertion here after
 * adding/removing practice items is expected — update the pin, don't
 * loosen the check).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { computeVerificationReport } from '../report';

describe('computeVerificationReport', () => {
  it('computes real counts from the committed practice-items bank', () => {
    const report = computeVerificationReport();
    expect(report.practice_bank.total_items).toBe(505);
    expect(report.practice_bank.bank_count).toBe(16);
    // All 505 committed items are hand-authored with a documented method —
    // per the provenance-grandfather convention (scripts/check-practice-items.ts).
    expect(report.practice_bank.with_verification_method).toBe(505);
    expect(report.practice_bank.without_verification_method).toBe(0);
    expect(report.headline.hand_verified_coverage_pct).toBe(100);
  });

  it('computes real counts from the committed content bundle', () => {
    const report = computeVerificationReport();
    // Pin moved 251 -> 756 when build-content-bundle.ts started folding in
    // the 505-item data/practice-items/ bank (bug #4 fix, live QA: "only
    // saw 10/15 questions" — the bank existed but the client-side resolver
    // never saw it). Real content change, not a bug.
    expect(report.content_bundle.total_problems).toBe(756);
    // As of this report's first run: the automated Wolfram sweep has never
    // executed in this repo. If this ever becomes non-zero, that's real
    // progress and this pin should move — not a bug to "fix" back to 0.
    expect(report.content_bundle.wolfram_verified).toBe(0);
    expect(report.content_bundle.never_yet_swept).toBe(756);
    expect(report.headline.automated_sweep_coverage_pct).toBe(0);
  });

  it('never conflates "not yet swept" with a fabricated quarantine/failure count', () => {
    const report = computeVerificationReport();
    // The type itself has no "quarantine" or "failed" field for the bundle —
    // this assertion documents that omission is deliberate, not an oversight.
    expect((report.content_bundle as any).quarantine).toBeUndefined();
    expect((report.content_bundle as any).failed).toBeUndefined();
  });

  it('surfaces an honest caveat when the automated sweep coverage is zero', () => {
    const report = computeVerificationReport();
    expect(report.caveats.some(c => c.includes('never run against this bundle'))).toBe(true);
  });

  it('breaks down the bundle by topic with per-topic wolfram_verified counts', () => {
    const report = computeVerificationReport();
    // Pins moved alongside the total_problems pin above (see that test).
    expect(report.content_bundle.by_topic['linear-algebra']?.total).toBe(167);
    expect(Object.values(report.content_bundle.by_topic).reduce((s, t) => s + t.total, 0)).toBe(756);
  });

  it('degrades honestly (no throw, zeroed shape) when the paths do not exist', () => {
    const report = computeVerificationReport({
      practiceItemsDir: '/nonexistent/practice-items',
      contentBundlePath: '/nonexistent/content-bundle.json',
    });
    expect(report.practice_bank.total_items).toBe(0);
    expect(report.content_bundle.total_problems).toBe(0);
    expect(report.caveats.some(c => c.includes('practice-items directory unreadable'))).toBe(true);
    expect(report.caveats.some(c => c.includes('content-bundle.json unreadable'))).toBe(true);
  });

  it('degrades honestly on a corrupt bank file without throwing or dropping other banks', () => {
    // A single malformed bank file must not take down the whole report —
    // matches src/lib/flat-file-store.ts's "corrupt returns default" contract.
    const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-report-test-'));
    fs.writeFileSync(path.join(scratchDir, 'good.json'), JSON.stringify({
      items: [{ id: 'a', verification_method: 'hand_checkable_x' }],
    }));
    fs.writeFileSync(path.join(scratchDir, 'bad.json'), '{ not valid json');
    const report = computeVerificationReport({
      practiceItemsDir: scratchDir,
      contentBundlePath: '/nonexistent/content-bundle.json',
    });
    expect(report.practice_bank.total_items).toBe(1);
    expect(report.caveats.some(c => c.includes('bad.json'))).toBe(true);
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });
});
