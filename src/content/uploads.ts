/**
 * src/content/uploads.ts
 *
 * Owning agent: upload-specialist (under acquisition-manager).
 *
 * Private user-upload storage + metadata index. Uploads are
 * user-scoped: stored under .data/user-uploads/{user_id}/, listed
 * and retrieved only by the owner, deleted on account-close.
 *
 * Constitutional guarantees:
 *   - Uploads NEVER enter cohort telemetry.
 *   - Uploads NEVER pass to external APIs (LLM, Wolfram) without
 *     explicit per-request user consent. (This module doesn't make
 *     such calls; content-router does, gated by an opt-in flag.)
 *   - Uploads are deleted on account-close (chained through
 *     data-rights-specialist's hard-delete path, which should call
 *     dropAllForUser() below).
 *
 * Scope limits for this cut:
 *   - Storage by user_id + metadata row. ✓
 *   - Listing, retrieval, per-item deletion. ✓
 *   - OCR / PDF text extraction is STUBBED (hooks present, not
 *     implemented — would need tesseract / pdf-parse deps). The
 *     upload is still stored and retrievable; indexing is deferred.
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, rmSync,
  statSync,
} from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOADS_META_PATH = '.data/user-uploads.json';
const UPLOADS_DIR_ROOT  = '.data/user-uploads';
const MAX_SIZE_BYTES    = 10 * 1024 * 1024;   // 10 MB per upload

// ─── Types ────────────────────────────────────────────────────────────

export type UploadKind = 'image' | 'pdf' | 'text' | 'other';

export interface UploadRecord {
  id:            string;                // "upl_<base32>"
  user_id:       string;
  filename:      string;                // original name
  kind:          UploadKind;
  size_bytes:    number;
  concept_tags:  string[];              // user-provided or OCR-extracted
  uploaded_at:   string;
  extracted_text?: string | null;       // null until OCR / PDF parse runs
  note?:         string;                // user-facing note
}

interface UploadStore {
  uploads: UploadRecord[];
}

// ─── Storage helpers ─────────────────────────────────────────────────

function _loadStore(): UploadStore {
  if (!existsSync(UPLOADS_META_PATH)) return { uploads: [] };
  try {
    return JSON.parse(readFileSync(UPLOADS_META_PATH, 'utf-8'));
  } catch {
    return { uploads: [] };
  }
}

function _saveStore(s: UploadStore): void {
  mkdirSync(path.dirname(UPLOADS_META_PATH), { recursive: true });
  writeFileSync(UPLOADS_META_PATH, JSON.stringify(s, null, 2));
}

function _userDir(user_id: string): string {
  return path.join(UPLOADS_DIR_ROOT, user_id);
}

function _blobPath(user_id: string, upload_id: string, ext: string): string {
  return path.join(_userDir(user_id), `${upload_id}${ext}`);
}

function _guessKind(filename: string): UploadKind {
  const lower = filename.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|heic)$/.test(lower)) return 'image';
  if (/\.pdf$/.test(lower)) return 'pdf';
  if (/\.(txt|md|tex)$/.test(lower)) return 'text';
  return 'other';
}

// ─── API ──────────────────────────────────────────────────────────────

export interface CreateUploadInput {
  user_id:      string;
  filename:     string;
  body:         Buffer | string;         // raw bytes (image/pdf) or text
  note?:        string;
  concept_tags?: string[];
}

export interface CreateUploadResult {
  ok: boolean;
  reason?: string;
  record?: UploadRecord;
}

export function createUpload(input: CreateUploadInput): CreateUploadResult {
  const body = typeof input.body === 'string' ? Buffer.from(input.body, 'utf-8') : input.body;
  if (body.length > MAX_SIZE_BYTES) {
    return { ok: false, reason: `upload exceeds ${MAX_SIZE_BYTES} byte limit` };
  }
  if (!input.user_id) {
    return { ok: false, reason: 'user_id required' };
  }

  mkdirSync(_userDir(input.user_id), { recursive: true });

  const kind = _guessKind(input.filename);
  const ext = path.extname(input.filename) || '';
  const upload_id = 'upl_' + randomBytes(8).toString('hex');

  const blobPath = _blobPath(input.user_id, upload_id, ext);
  writeFileSync(blobPath, body);

  const record: UploadRecord = {
    id: upload_id,
    user_id: input.user_id,
    filename: input.filename,
    kind,
    size_bytes: body.length,
    concept_tags: input.concept_tags ?? [],
    uploaded_at: new Date().toISOString(),
    extracted_text: kind === 'text' ? body.toString('utf-8').slice(0, 8192) : null,
    note: input.note,
  };

  const store = _loadStore();
  store.uploads.push(record);
  _saveStore(store);
  _bumpCount(input.user_id, +1);

  return { ok: true, record };
}

export function listUploads(user_id: string): UploadRecord[] {
  const store = _loadStore();
  return store.uploads.filter(u => u.user_id === user_id);
}

export function getUpload(user_id: string, upload_id: string): UploadRecord | null {
  const store = _loadStore();
  return store.uploads.find(u => u.user_id === user_id && u.id === upload_id) ?? null;
}

/**
 * Returns the binary payload of an upload. Caller is responsible for
 * the correct Content-Type in HTTP responses.
 */
export function readUploadBytes(user_id: string, upload_id: string): { bytes: Buffer; record: UploadRecord } | null {
  const record = getUpload(user_id, upload_id);
  if (!record) return null;
  const ext = path.extname(record.filename) || '';
  const blobPath = _blobPath(user_id, upload_id, ext);
  if (!existsSync(blobPath)) return null;
  return { bytes: readFileSync(blobPath), record };
}

export function deleteUpload(user_id: string, upload_id: string): boolean {
  const store = _loadStore();
  const before = store.uploads.length;
  const record = store.uploads.find(u => u.user_id === user_id && u.id === upload_id);
  if (!record) return false;
  const ext = path.extname(record.filename) || '';
  const blobPath = _blobPath(user_id, upload_id, ext);
  try { if (existsSync(blobPath)) unlinkSync(blobPath); } catch { /* best effort */ }
  store.uploads = store.uploads.filter(u => !(u.user_id === user_id && u.id === upload_id));
  _saveStore(store);
  const removed = store.uploads.length < before;
  if (removed) _bumpCount(user_id, -1);
  return removed;
}

/**
 * Drop ALL uploads for a user. Called by data-rights-specialist on
 * hard-delete.
 */
export function dropAllForUser(user_id: string): { uploads_dropped: number } {
  const store = _loadStore();
  const before = store.uploads.length;
  store.uploads = store.uploads.filter(u => u.user_id !== user_id);
  _saveStore(store);
  _userUploadCountCache.set(user_id, 0);
  // Remove the user's blob directory
  const dir = _userDir(user_id);
  try {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  } catch { /* best effort */ }
  return { uploads_dropped: before - store.uploads.length };
}

/**
 * Find uploads tagged with a given concept_id. Used by content-router
 * when the intent is find-in-uploads.
 */
export function findUploadsByConcept(user_id: string, concept_id: string): UploadRecord[] {
  return listUploads(user_id).filter(u => u.concept_tags.includes(concept_id));
}

// ─── Fast-path cache for upload blending ─────────────────────────────
//
// Per ER-D8: most users have zero uploads. Calling listUploads() on every
// route request is wasteful. Cache the per-user count so the router can
// skip the call entirely when there's nothing to find. Cache is invalidated
// on createUpload / deleteUpload / dropAllForUser.

const _userUploadCountCache = new Map<string, number>();

function _bumpCount(user_id: string, delta: number): void {
  const current = _userUploadCountCache.get(user_id);
  if (current === undefined) return; // not cached, will be computed on next read
  _userUploadCountCache.set(user_id, Math.max(0, current + delta));
}

/**
 * Fast-path check: does this user have any uploads at all?
 * Used by the router to skip findUploadsByConcept() for the common case (zero uploads).
 */
export function userHasUploads(user_id: string): boolean {
  if (!user_id) return false;
  let count = _userUploadCountCache.get(user_id);
  if (count === undefined) {
    count = listUploads(user_id).length;
    _userUploadCountCache.set(user_id, count);
  }
  return count > 0;
}

/** Test-only helper: clear the upload-count cache between tests. */
export function _resetUploadCountCache(): void {
  _userUploadCountCache.clear();
}
