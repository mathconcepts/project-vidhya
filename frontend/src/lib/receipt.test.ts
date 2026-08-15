import { describe, it, expect } from 'vitest';
import {
  receiptFromVerification,
  receiptFromServerGrade,
  RECEIPT_CONFIDENCE_FLOOR,
  NO_RECEIPT,
} from './receipt';

describe('receiptFromVerification', () => {
  it('mints a receipt for a confident verified result', () => {
    const r = receiptFromVerification({ status: 'verified', confidence: 0.95, tierUsed: 'tier3_wolfram' });
    expect(r).toEqual({ verified: true, source: 'tier3_wolfram' });
  });

  it('refuses a verified result below the confidence floor', () => {
    // A hedged verification is not a proof, and the border does not hedge.
    expect(
      receiptFromVerification({ status: 'verified', confidence: RECEIPT_CONFIDENCE_FLOOR - 0.01 }),
    ).toBeNull();
  });

  it('accepts exactly at the floor', () => {
    expect(
      receiptFromVerification({ status: 'verified', confidence: RECEIPT_CONFIDENCE_FLOOR }),
    ).not.toBeNull();
  });

  it.each(['partial', 'failed', 'inconclusive', 'pending', ''])(
    'refuses status %o however confident',
    (status) => {
      expect(receiptFromVerification({ status, confidence: 1 })).toBeNull();
    },
  );

  it('refuses a missing or malformed record', () => {
    expect(receiptFromVerification(null)).toBeNull();
    expect(receiptFromVerification(undefined)).toBeNull();
    expect(receiptFromVerification({ status: 'verified', confidence: NaN })).toBeNull();
  });

  it('names the pipeline when the tier is absent, never an empty source', () => {
    const r = receiptFromVerification({ status: 'verified', confidence: 0.9 });
    expect(r?.source).toBeTruthy();
  });
});

describe('receiptFromServerGrade', () => {
  it('mints a receipt for a real server grade', () => {
    expect(receiptFromServerGrade({ max: 2 })).toEqual({
      verified: true,
      source: 'gate_deterministic_scorer',
    });
  });

  it('attests the mark, not the outcome — a wrong answer still earns the border', () => {
    // The border promises "this mark is real", not "you did well". A zero-mark
    // grade is just as server-computed as a full-mark one.
    expect(receiptFromServerGrade({ max: 0 })).not.toBeNull();
  });

  it('refuses when the server did not score it', () => {
    expect(receiptFromServerGrade(null)).toBeNull();
    expect(receiptFromServerGrade(undefined)).toBeNull();
    expect(receiptFromServerGrade({})).toBeNull();
    expect(receiptFromServerGrade({ max: NaN })).toBeNull();
  });

  it('allows an explicit scorer name', () => {
    expect(receiptFromServerGrade({ max: 1 }, { scorer: 'rubric_grader' })?.source).toBe(
      'rubric_grader',
    );
  });
});

describe('the law', () => {
  it('NO_RECEIPT is null so ReceiptBorder renders children bare', () => {
    expect(NO_RECEIPT).toBeNull();
  });

  it('every minted receipt names a non-empty source', () => {
    // `source` being required is what stops `{ verified: true }` type-checking
    // at a call site. A constructor returning an empty source would reopen the
    // hole through the back door.
    const minted = [
      receiptFromVerification({ status: 'verified', confidence: 1, tierUsed: 'tier1_rag' }),
      receiptFromVerification({ status: 'verified', confidence: 1 }),
      receiptFromServerGrade({ max: 3 }),
    ];
    for (const r of minted) {
      expect(r).not.toBeNull();
      expect(r!.source.length).toBeGreaterThan(0);
    }
  });

  it('no constructor can be coaxed into attesting absent data', () => {
    const fromNothing = [
      receiptFromVerification({ status: 'verified', confidence: 0 }),
      receiptFromVerification({ status: '', confidence: 1 }),
      receiptFromServerGrade({}),
    ];
    expect(fromNothing.every((r) => r === null)).toBe(true);
  });
});
