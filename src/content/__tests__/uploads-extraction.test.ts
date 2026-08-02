/**
 * uploads.ts — born-digital extraction tests (realignment item 6).
 *
 * Covers:
 *   - plain text/markdown passthrough → extracted_text populated
 *   - born-digital PDF → text layer extracted via pdf-parse
 *   - scanned/image-only PDF → honest refusal (ExtractionEmptyError with
 *     the PROTECTED scanned-doc copy), extracted_text null, never a crash
 *   - corrupt PDF → named ExtractionFailedError recorded, upload still ok
 *   - the 10MB cap still enforced
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  createUpload,
  dropAllForUser,
  SCANNED_DOC_REFUSAL,
  _resetUploadCountCache,
} from '../uploads';

const TEST_USER = 'test-user-uploads-extraction';

afterAll(() => {
  dropAllForUser(TEST_USER);
  _resetUploadCountCache();
});

/** Minimal born-digital PDF with a real text layer. */
function textPdf(text: string): Buffer {
  return Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    `4 0 obj<</Length ${text.length + 40}>>stream\n` +
    `BT /F1 24 Tf 100 700 Td (${text}) Tj ET\n` +
    'endstream\nendobj\n' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    'xref\n0 6\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF',
  );
}

/** Minimal PDF with a page but NO text operators — models a scanned doc. */
function scannedPdf(): Buffer {
  return Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n' +
    '4 0 obj<</Length 0>>stream\n\nendstream\nendobj\n' +
    'xref\n0 5\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n0\n%%EOF',
  );
}

describe('createUpload — text passthrough', () => {
  it('populates extracted_text for markdown/plain text', async () => {
    const result = await createUpload({
      user_id: TEST_USER,
      filename: 'notes.md',
      body: '# Derivatives\nThe derivative measures instantaneous rate of change.',
    });
    expect(result.ok).toBe(true);
    expect(result.record?.extraction_status).toBe('extracted');
    expect(result.record?.extracted_text).toContain('instantaneous rate of change');
    expect(result.record?.extraction_error).toBeNull();
  });
});

describe('createUpload — born-digital PDF', () => {
  it('extracts the text layer via pdf-parse', async () => {
    const long = 'The product rule states derivative of f times g equals f prime g plus f g prime always';
    const result = await createUpload({
      user_id: TEST_USER,
      filename: 'class-notes.pdf',
      body: textPdf(long),
    });
    expect(result.ok).toBe(true);
    expect(result.record?.kind).toBe('pdf');
    expect(result.record?.extraction_status).toBe('extracted');
    expect(result.record?.extracted_text).toContain('product rule');
    expect(result.record?.extraction_error).toBeNull();
  });
});

describe('createUpload — scanned/image-only PDF (honest refusal)', () => {
  it('sets extracted_text null and records ExtractionEmptyError with the protected copy', async () => {
    const result = await createUpload({
      user_id: TEST_USER,
      filename: 'scanned-worksheet.pdf',
      body: scannedPdf(),
    });
    expect(result.ok).toBe(true); // the upload itself succeeds — refusal, not crash
    expect(result.record?.extracted_text).toBeNull();
    expect(result.record?.extraction_status).toBe('refused_scanned');
    expect(result.record?.extraction_error).toBe(`ExtractionEmptyError: ${SCANNED_DOC_REFUSAL}`);
  });

  it('the protected copy string is exactly the design-law wording', () => {
    // Register law #5 / UX design law §9.15: changing this requires a
    // decision log entry. This assertion is the tripwire.
    expect(SCANNED_DOC_REFUSAL).toBe("couldn't read this PDF (scanned docs not yet supported)");
  });
});

describe('createUpload — corrupt PDF (named failure, never a crash)', () => {
  it('records ExtractionFailedError and keeps the upload', async () => {
    const result = await createUpload({
      user_id: TEST_USER,
      filename: 'broken.pdf',
      body: Buffer.from('this is not a pdf at all, just bytes with a pdf name'),
    });
    expect(result.ok).toBe(true);
    expect(result.record?.extracted_text).toBeNull();
    expect(result.record?.extraction_status).toBe('failed');
    expect(result.record?.extraction_error).toMatch(/^ExtractionFailedError: /);
  });
});

describe('createUpload — size cap', () => {
  it('still refuses uploads over 10MB', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1);
    const result = await createUpload({
      user_id: TEST_USER,
      filename: 'huge.pdf',
      body: big,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('byte limit');
  });
});
