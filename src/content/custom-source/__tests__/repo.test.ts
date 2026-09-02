import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  FileCustomSourceRepo,
  PermissionNotConfirmedError,
  MissingReviewNoteError,
} from '../repo';
import type { CustomSourceDocument } from '../types';

let tmpDir: string;
let repo: FileCustomSourceRepo;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custom-source-'));
  repo = new FileCustomSourceRepo(path.join(tmpDir, 'custom-source.json'));
});

function docInput(overrides: Partial<Omit<CustomSourceDocument, 'id' | 'uploaded_at' | 'status'>> = {}) {
  return {
    uploader_id: 'operator-1',
    title: 'A classroom note on eigenvalues',
    file_hash: 'sha256-abc123',
    mime_type: 'application/pdf',
    permission_confirmed: true,
    ...overrides,
  };
}

describe('registerDocument', () => {
  it('creates a new document with a registered status', async () => {
    const doc = await repo.registerDocument(docInput());
    expect(doc.status).toBe('registered');
    expect(doc.id).toBeTruthy();
    expect(doc.uploaded_at).toBeTruthy();
  });

  it('is idempotent on file_hash — a re-registration returns the SAME document, not a duplicate', async () => {
    const first = await repo.registerDocument(docInput());
    const second = await repo.registerDocument(docInput({ title: 'A different title for the same file' }));
    expect(second.id).toBe(first.id);
    expect(second.title).toBe(first.title); // the ORIGINAL title, not overwritten
  });

  it('two different files (different hashes) create two separate documents', async () => {
    const a = await repo.registerDocument(docInput({ file_hash: 'hash-a' }));
    const b = await repo.registerDocument(docInput({ file_hash: 'hash-b' }));
    expect(a.id).not.toBe(b.id);
  });
});

describe('findDocumentByHash', () => {
  it('finds a registered document by its hash', async () => {
    const created = await repo.registerDocument(docInput());
    const found = await repo.findDocumentByHash(created.file_hash);
    expect(found?.id).toBe(created.id);
  });

  it('returns null for an unknown hash', async () => {
    expect(await repo.findDocumentByHash('never-registered')).toBeNull();
  });
});

describe('addSpans — permission gate', () => {
  it('refuses to add spans when permission_confirmed is false', async () => {
    const doc = await repo.registerDocument(docInput({ permission_confirmed: false }));
    await expect(
      repo.addSpans(doc.id, [{ extracted_text: 'text', extraction_method: 'text_layer', extraction_quality: 0.9 }], 0.9),
    ).rejects.toThrow(PermissionNotConfirmedError);
  });

  it('throws for an unknown document id', async () => {
    await expect(
      repo.addSpans('does-not-exist', [], 0.9),
    ).rejects.toThrow(/not found/);
  });

  it('accepts spans and marks the document extracted when permission is confirmed', async () => {
    const doc = await repo.registerDocument(docInput({ permission_confirmed: true }));
    const spans = await repo.addSpans(
      doc.id,
      [
        { page_number: 1, extracted_text: 'Eigenvalues satisfy det(A - λI) = 0', extraction_method: 'text_layer', extraction_quality: 0.95 },
        { page_number: 2, extracted_text: 'A repeated eigenvalue may have a smaller eigenspace', extraction_method: 'ocr', extraction_quality: 0.6 },
      ],
      0.775,
    );
    expect(spans).toHaveLength(2);
    expect(spans.every((s) => s.source_document_id === doc.id)).toBe(true);

    const updated = await repo.findDocumentByHash(doc.file_hash);
    expect(updated?.status).toBe('extracted');
    expect(updated?.extraction_quality).toBe(0.775);
  });
});

describe('listSpans', () => {
  it('returns only spans for the requested document', async () => {
    const docA = await repo.registerDocument(docInput({ file_hash: 'hash-a' }));
    const docB = await repo.registerDocument(docInput({ file_hash: 'hash-b' }));
    await repo.addSpans(docA.id, [{ extracted_text: 'from A', extraction_method: 'text_layer', extraction_quality: 1 }], 1);
    await repo.addSpans(docB.id, [{ extracted_text: 'from B', extraction_method: 'text_layer', extraction_quality: 1 }], 1);

    const spansA = await repo.listSpans(docA.id);
    expect(spansA).toHaveLength(1);
    expect(spansA[0].extracted_text).toBe('from A');
  });
});

describe('addClaimDraft + listClaims', () => {
  async function seedSpan() {
    const doc = await repo.registerDocument(docInput());
    const [span] = await repo.addSpans(doc.id, [{ extracted_text: 'A repeated eigenvalue may have a smaller eigenspace', extraction_method: 'text_layer', extraction_quality: 0.9 }], 0.9);
    return span;
  }

  it('creates a claim in pending review status', async () => {
    const span = await seedSpan();
    const claim = await repo.addClaimDraft({
      source_span_id: span.id,
      concept_id: 'eigenvalues',
      claim_text: 'A repeated eigenvalue can have geometric multiplicity less than its algebraic multiplicity.',
      delta_kind: 'custom_source',
      locator: { page: '2', source_id: span.source_document_id },
    });
    expect(claim.review_status).toBe('pending');
    expect(claim.created_at).toBeTruthy();
  });

  it('filters by concept_id and status', async () => {
    const span = await seedSpan();
    await repo.addClaimDraft({ source_span_id: span.id, concept_id: 'eigenvalues', claim_text: 'c1', delta_kind: 'custom_source', locator: {} });
    await repo.addClaimDraft({ source_span_id: span.id, concept_id: 'determinants', claim_text: 'c2', delta_kind: 'custom_source', locator: {} });

    const eigenClaims = await repo.listClaims({ concept_id: 'eigenvalues' });
    expect(eigenClaims).toHaveLength(1);
    expect(eigenClaims[0].claim_text).toBe('c1');

    const pending = await repo.listClaims({ status: 'pending' });
    expect(pending).toHaveLength(2);
  });

  it('orders claims oldest-first', async () => {
    const span = await seedSpan();
    const first = await repo.addClaimDraft({ source_span_id: span.id, concept_id: 'eigenvalues', claim_text: 'first', delta_kind: 'custom_source', locator: {} });
    const second = await repo.addClaimDraft({ source_span_id: span.id, concept_id: 'eigenvalues', claim_text: 'second', delta_kind: 'custom_source', locator: {} });
    const claims = await repo.listClaims();
    expect(claims.map((c) => c.id)).toEqual([first.id, second.id]);
  });
});

describe('resolveClaim', () => {
  async function seedClaim() {
    const doc = await repo.registerDocument(docInput());
    const [span] = await repo.addSpans(doc.id, [{ extracted_text: 't', extraction_method: 'text_layer', extraction_quality: 0.9 }], 0.9);
    return repo.addClaimDraft({ source_span_id: span.id, concept_id: 'eigenvalues', claim_text: 'claim', delta_kind: 'custom_source', locator: {} });
  }

  it('approves a pending claim', async () => {
    const claim = await seedClaim();
    const resolved = await repo.resolveClaim(claim.id, 'approved', 'reviewer-1');
    expect(resolved?.review_status).toBe('approved');
    expect(resolved?.reviewer_id).toBe('reviewer-1');
    expect(resolved?.reviewed_at).toBeTruthy();
  });

  it('requires a review_note to reject', async () => {
    const claim = await seedClaim();
    await expect(repo.resolveClaim(claim.id, 'rejected', 'reviewer-1')).rejects.toThrow(MissingReviewNoteError);
  });

  it('requires a review_note to quarantine', async () => {
    const claim = await seedClaim();
    await expect(repo.resolveClaim(claim.id, 'quarantined', 'reviewer-1')).rejects.toThrow(MissingReviewNoteError);
  });

  it('rejects with a note recorded', async () => {
    const claim = await seedClaim();
    const resolved = await repo.resolveClaim(claim.id, 'rejected', 'reviewer-1', 'conflicts with the canonical definition');
    expect(resolved?.review_status).toBe('rejected');
    expect(resolved?.review_note).toBe('conflicts with the canonical definition');
  });

  it('is idempotent — resolving an already-resolved claim again does not overwrite the first decision', async () => {
    const claim = await seedClaim();
    await repo.resolveClaim(claim.id, 'approved', 'reviewer-1');
    const second = await repo.resolveClaim(claim.id, 'rejected', 'reviewer-2', 'trying to override');
    expect(second?.review_status).toBe('approved'); // unchanged — the first decision stands
    expect(second?.reviewer_id).toBe('reviewer-1');
  });

  it('returns null for an unknown claim id', async () => {
    expect(await repo.resolveClaim('does-not-exist', 'approved', 'reviewer-1')).toBeNull();
  });
});

describe('describe', () => {
  it('names the file path', () => {
    expect(repo.describe()).toContain('custom-source.json');
  });
});
