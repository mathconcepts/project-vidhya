/**
 * src/content/custom-source/repo.ts
 *
 * Storage boundary for the custom-PDF ingestion data model
 * (src/content/custom-source/types.ts) — CRUD only, no extraction/OCR (see
 * that file's module doc for the seam that step lands behind later).
 *
 * Two implementations behind one interface, matching every other repo in
 * src/storage/repositories/ (e.g. pedagogy-shadow-repo.ts):
 *   - PgCustomSourceRepo   — Postgres, tables from migration 057.
 *   - FileCustomSourceRepo — JSON file, for DB-less demo/dev runs, same
 *     `.data/storage/` convention as the other file-backed repos.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSharedPool } from '../../storage/pool';
import type {
  ClaimDraft,
  ClaimReviewStatus,
  CustomSourceDocument,
  SourceSpan,
} from './types';

export interface CustomSourceRepo {
  /**
   * Registers a document. Idempotent on file_hash — registering the same
   * file twice returns the EXISTING document rather than creating a
   * duplicate (research §15.6: a re-upload is not a new source).
   */
  registerDocument(
    doc: Omit<CustomSourceDocument, 'id' | 'uploaded_at' | 'status'>,
  ): Promise<CustomSourceDocument>;
  findDocumentByHash(file_hash: string): Promise<CustomSourceDocument | null>;
  /**
   * Attaches extracted spans to a document and marks it 'extracted'.
   * Refuses (throws) when the document's permission_confirmed is not true
   * — see types.ts's CustomSourceDocument doc: this module enforces that
   * gate, not just documents it.
   */
  addSpans(
    source_document_id: string,
    spans: Array<Omit<SourceSpan, 'id' | 'source_document_id'>>,
    overall_quality: number,
  ): Promise<SourceSpan[]>;
  listSpans(source_document_id: string): Promise<SourceSpan[]>;
  addClaimDraft(
    draft: Omit<ClaimDraft, 'id' | 'created_at' | 'review_status'>,
  ): Promise<ClaimDraft>;
  /** Every claim, optionally filtered. Pending-first-by-age when status is 'pending' — oldest unreviewed claim first, the review-queue convention this repo's callers should expect. */
  listClaims(filter?: { concept_id?: string; status?: ClaimReviewStatus }): Promise<ClaimDraft[]>;
  /**
   * Resolves a pending claim. Refuses (throws) when status is 'rejected' or
   * 'quarantined' and no review_note is given — an operator decision with
   * no reason recorded is not an audit trail (types.ts's own contract).
   * Idempotent: resolving an already-resolved claim again is a no-op that
   * returns the existing (already-resolved) row, never a silent overwrite.
   */
  resolveClaim(
    id: string,
    status: Exclude<ClaimReviewStatus, 'pending'>,
    reviewer_id: string,
    review_note?: string,
  ): Promise<ClaimDraft | null>;
  describe(): string;
}

export class PermissionNotConfirmedError extends Error {
  constructor(document_id: string) {
    super(`custom-source document ${document_id} has permission_confirmed=false — cannot add spans`);
    this.name = 'PermissionNotConfirmedError';
  }
}

export class MissingReviewNoteError extends Error {
  constructor(status: string) {
    super(`resolving a claim as '${status}' requires a review_note — an undocumented rejection is not an audit trail`);
    this.name = 'MissingReviewNoteError';
  }
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

// ---------------------------------------------------------------------------

export class PgCustomSourceRepo implements CustomSourceRepo {
  async registerDocument(
    doc: Omit<CustomSourceDocument, 'id' | 'uploaded_at' | 'status'>,
  ): Promise<CustomSourceDocument> {
    const pool = getSharedPool();
    if (!pool) throw new Error('[custom-source] registerDocument requires a database');

    const existing = await this.findDocumentByHash(doc.file_hash);
    if (existing) return existing;

    const id = newId('csd');
    const { rows } = await pool.query(
      `INSERT INTO custom_source_documents
         (id, uploader_id, title, file_hash, mime_type, page_count, permission_confirmed, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'registered')
       ON CONFLICT (file_hash) DO UPDATE SET file_hash = EXCLUDED.file_hash
       RETURNING id, uploader_id, title, file_hash, mime_type, page_count,
                 permission_confirmed, extraction_quality, uploaded_at, status`,
      [id, doc.uploader_id, doc.title, doc.file_hash, doc.mime_type, doc.page_count ?? null, doc.permission_confirmed],
    );
    return rowToDocument(rows[0]);
  }

  async findDocumentByHash(file_hash: string): Promise<CustomSourceDocument | null> {
    const pool = getSharedPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT id, uploader_id, title, file_hash, mime_type, page_count,
              permission_confirmed, extraction_quality, uploaded_at, status
         FROM custom_source_documents WHERE file_hash = $1`,
      [file_hash],
    );
    return rows[0] ? rowToDocument(rows[0]) : null;
  }

  async addSpans(
    source_document_id: string,
    spans: Array<Omit<SourceSpan, 'id' | 'source_document_id'>>,
    overall_quality: number,
  ): Promise<SourceSpan[]> {
    const pool = getSharedPool();
    if (!pool) throw new Error('[custom-source] addSpans requires a database');

    const { rows: docRows } = await pool.query(
      `SELECT permission_confirmed FROM custom_source_documents WHERE id = $1`,
      [source_document_id],
    );
    if (docRows.length === 0) throw new Error(`custom-source document ${source_document_id} not found`);
    if (!docRows[0].permission_confirmed) throw new PermissionNotConfirmedError(source_document_id);

    const inserted: SourceSpan[] = [];
    for (const span of spans) {
      const id = newId('span');
      const { rows } = await pool.query(
        `INSERT INTO source_spans
           (id, source_document_id, page_number, section_heading, extracted_text, extraction_method, extraction_quality)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, source_document_id, page_number, section_heading, extracted_text, extraction_method, extraction_quality`,
        [id, source_document_id, span.page_number ?? null, span.section_heading ?? null, span.extracted_text, span.extraction_method, span.extraction_quality],
      );
      inserted.push(rowToSpan(rows[0]));
    }

    await pool.query(
      `UPDATE custom_source_documents SET extraction_quality = $2, status = 'extracted' WHERE id = $1`,
      [source_document_id, overall_quality],
    );

    return inserted;
  }

  async listSpans(source_document_id: string): Promise<SourceSpan[]> {
    const pool = getSharedPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT id, source_document_id, page_number, section_heading, extracted_text, extraction_method, extraction_quality
         FROM source_spans WHERE source_document_id = $1 ORDER BY page_number NULLS LAST, id`,
      [source_document_id],
    );
    return rows.map(rowToSpan);
  }

  async addClaimDraft(
    draft: Omit<ClaimDraft, 'id' | 'created_at' | 'review_status'>,
  ): Promise<ClaimDraft> {
    const pool = getSharedPool();
    if (!pool) throw new Error('[custom-source] addClaimDraft requires a database');
    const id = newId('claim');
    const { rows } = await pool.query(
      `INSERT INTO source_claim_drafts
         (id, source_span_id, concept_id, claim_text, delta_kind, locator, review_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, source_span_id, concept_id, claim_text, delta_kind, locator,
                 review_status, created_at, reviewed_at, reviewer_id, review_note`,
      [id, draft.source_span_id, draft.concept_id, draft.claim_text, draft.delta_kind, JSON.stringify(draft.locator ?? {})],
    );
    return rowToClaim(rows[0]);
  }

  async listClaims(filter?: { concept_id?: string; status?: ClaimReviewStatus }): Promise<ClaimDraft[]> {
    const pool = getSharedPool();
    if (!pool) return [];
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter?.concept_id) { params.push(filter.concept_id); clauses.push(`concept_id = $${params.length}`); }
    if (filter?.status) { params.push(filter.status); clauses.push(`review_status = $${params.length}`); }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT id, source_span_id, concept_id, claim_text, delta_kind, locator,
              review_status, created_at, reviewed_at, reviewer_id, review_note
         FROM source_claim_drafts ${where} ORDER BY created_at ASC`,
      params,
    );
    return rows.map(rowToClaim);
  }

  async resolveClaim(
    id: string,
    status: Exclude<ClaimReviewStatus, 'pending'>,
    reviewer_id: string,
    review_note?: string,
  ): Promise<ClaimDraft | null> {
    const pool = getSharedPool();
    if (!pool) return null;
    if ((status === 'rejected' || status === 'quarantined') && !review_note) {
      throw new MissingReviewNoteError(status);
    }
    const { rows } = await pool.query(
      `UPDATE source_claim_drafts
         SET review_status = $2, reviewer_id = $3, review_note = $4, reviewed_at = NOW()
       WHERE id = $1 AND review_status = 'pending'
       RETURNING id, source_span_id, concept_id, claim_text, delta_kind, locator,
                 review_status, created_at, reviewed_at, reviewer_id, review_note`,
      [id, status, reviewer_id, review_note ?? null],
    );
    if (rows.length > 0) return rowToClaim(rows[0]);

    // Already resolved (or missing) — idempotent read-back rather than a
    // silent overwrite of a prior operator's decision.
    const { rows: existing } = await pool.query(
      `SELECT id, source_span_id, concept_id, claim_text, delta_kind, locator,
              review_status, created_at, reviewed_at, reviewer_id, review_note
         FROM source_claim_drafts WHERE id = $1`,
      [id],
    );
    return existing[0] ? rowToClaim(existing[0]) : null;
  }

  describe(): string {
    return 'postgres:custom_source_documents+source_spans+source_claim_drafts';
  }
}

function rowToDocument(r: Record<string, unknown>): CustomSourceDocument {
  return {
    id: String(r.id),
    uploader_id: String(r.uploader_id),
    title: String(r.title),
    file_hash: String(r.file_hash),
    mime_type: String(r.mime_type),
    page_count: r.page_count != null ? Number(r.page_count) : undefined,
    permission_confirmed: Boolean(r.permission_confirmed),
    extraction_quality: r.extraction_quality != null ? Number(r.extraction_quality) : undefined,
    uploaded_at: r.uploaded_at instanceof Date ? r.uploaded_at.toISOString() : String(r.uploaded_at),
    status: r.status as CustomSourceDocument['status'],
  };
}

function rowToSpan(r: Record<string, unknown>): SourceSpan {
  return {
    id: String(r.id),
    source_document_id: String(r.source_document_id),
    page_number: r.page_number != null ? Number(r.page_number) : undefined,
    section_heading: r.section_heading != null ? String(r.section_heading) : undefined,
    extracted_text: String(r.extracted_text),
    extraction_method: r.extraction_method as SourceSpan['extraction_method'],
    extraction_quality: Number(r.extraction_quality),
  };
}

function rowToClaim(r: Record<string, unknown>): ClaimDraft {
  return {
    id: String(r.id),
    source_span_id: String(r.source_span_id),
    concept_id: String(r.concept_id),
    claim_text: String(r.claim_text),
    delta_kind: r.delta_kind as ClaimDraft['delta_kind'],
    locator: typeof r.locator === 'string' ? JSON.parse(r.locator) : (r.locator as ClaimDraft['locator']) ?? {},
    review_status: r.review_status as ClaimReviewStatus,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    reviewed_at: r.reviewed_at ? (r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : String(r.reviewed_at)) : undefined,
    reviewer_id: r.reviewer_id != null ? String(r.reviewer_id) : undefined,
    review_note: r.review_note != null ? String(r.review_note) : undefined,
  };
}

// ---------------------------------------------------------------------------

interface FileShape {
  documents: CustomSourceDocument[];
  spans: SourceSpan[];
  claims: ClaimDraft[];
}

export class FileCustomSourceRepo implements CustomSourceRepo {
  constructor(private file = path.join('.data', 'storage', 'custom-source.json')) {}

  private read(): FileShape {
    try {
      if (!fs.existsSync(this.file)) return { documents: [], spans: [], claims: [] };
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      return {
        documents: Array.isArray(parsed.documents) ? parsed.documents : [],
        spans: Array.isArray(parsed.spans) ? parsed.spans : [],
        claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      };
    } catch {
      return { documents: [], spans: [], claims: [] };
    }
  }

  private write(state: FileShape): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(state, null, 2));
  }

  async registerDocument(
    doc: Omit<CustomSourceDocument, 'id' | 'uploaded_at' | 'status'>,
  ): Promise<CustomSourceDocument> {
    const state = this.read();
    const existing = state.documents.find((d) => d.file_hash === doc.file_hash);
    if (existing) return existing;

    const created: CustomSourceDocument = {
      ...doc,
      id: newId('csd'),
      uploaded_at: new Date().toISOString(),
      status: 'registered',
    };
    state.documents.push(created);
    this.write(state);
    return created;
  }

  async findDocumentByHash(file_hash: string): Promise<CustomSourceDocument | null> {
    return this.read().documents.find((d) => d.file_hash === file_hash) ?? null;
  }

  async addSpans(
    source_document_id: string,
    spans: Array<Omit<SourceSpan, 'id' | 'source_document_id'>>,
    overall_quality: number,
  ): Promise<SourceSpan[]> {
    const state = this.read();
    const doc = state.documents.find((d) => d.id === source_document_id);
    if (!doc) throw new Error(`custom-source document ${source_document_id} not found`);
    if (!doc.permission_confirmed) throw new PermissionNotConfirmedError(source_document_id);

    const created = spans.map((s) => ({ ...s, id: newId('span'), source_document_id }));
    state.spans.push(...created);
    doc.extraction_quality = overall_quality;
    doc.status = 'extracted';
    this.write(state);
    return created;
  }

  async listSpans(source_document_id: string): Promise<SourceSpan[]> {
    return this.read().spans.filter((s) => s.source_document_id === source_document_id);
  }

  async addClaimDraft(
    draft: Omit<ClaimDraft, 'id' | 'created_at' | 'review_status'>,
  ): Promise<ClaimDraft> {
    const state = this.read();
    const created: ClaimDraft = {
      ...draft,
      id: newId('claim'),
      created_at: new Date().toISOString(),
      review_status: 'pending',
    };
    state.claims.push(created);
    this.write(state);
    return created;
  }

  async listClaims(filter?: { concept_id?: string; status?: ClaimReviewStatus }): Promise<ClaimDraft[]> {
    let claims = this.read().claims;
    if (filter?.concept_id) claims = claims.filter((c) => c.concept_id === filter.concept_id);
    if (filter?.status) claims = claims.filter((c) => c.review_status === filter.status);
    return [...claims].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async resolveClaim(
    id: string,
    status: Exclude<ClaimReviewStatus, 'pending'>,
    reviewer_id: string,
    review_note?: string,
  ): Promise<ClaimDraft | null> {
    if ((status === 'rejected' || status === 'quarantined') && !review_note) {
      throw new MissingReviewNoteError(status);
    }
    const state = this.read();
    const claim = state.claims.find((c) => c.id === id);
    if (!claim) return null;
    if (claim.review_status !== 'pending') return claim; // idempotent — never overwrite a prior decision

    claim.review_status = status;
    claim.reviewer_id = reviewer_id;
    claim.review_note = review_note;
    claim.reviewed_at = new Date().toISOString();
    this.write(state);
    return claim;
  }

  describe(): string {
    return `file:${this.file}`;
  }
}

// ---------------------------------------------------------------------------

let _repo: CustomSourceRepo | null = null;

/** Postgres when DATABASE_URL is set, a JSON file otherwise — same convention as getPedagogyShadowRepo. */
export function getCustomSourceRepo(): CustomSourceRepo {
  if (!_repo) {
    _repo = getSharedPool() ? new PgCustomSourceRepo() : new FileCustomSourceRepo();
  }
  return _repo;
}

/** Tests only. */
export function _setCustomSourceRepo(r: CustomSourceRepo | null): void {
  _repo = r;
}
