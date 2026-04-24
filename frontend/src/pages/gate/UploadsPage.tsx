/**
 * UploadsPage — private file uploads (notes, problem photos, PDFs)
 * that the content-router can later find via the `find-in-uploads`
 * intent.
 *
 * Route: /gate/uploads
 *
 * Owning agent: upload-specialist (under acquisition-manager, CCO).
 *
 * Backend endpoints (all shipped):
 *   POST   /api/student/uploads          { filename, body_base64, note?, concept_tags? }
 *   GET    /api/student/uploads          → { uploads, count }
 *   GET    /api/student/uploads/:id      → UploadRecord
 *   DELETE /api/student/uploads/:id      → { ok, id }
 *
 * Constitutional constraints surfaced in the UI:
 *   - Uploads are USER-PRIVATE — never shared, never enter cohort
 *     telemetry, deleted on account close.
 *   - Nothing on the upload is ever submitted to an LLM or Wolfram
 *     without per-request consent (router honors this).
 *
 * Effective size limits:
 *   - Server caps the raw JSON request body at 10 MB.
 *   - Base64 encoding adds ~33% overhead, so binary uploads have an
 *     effective ~7.5 MB ceiling. The UI refuses files over 7.5 MB
 *     up-front with a clear message rather than letting the server
 *     return a confusing error.
 *
 * PENDING.md §4.8 — second frontend page on shipped endpoints.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import {
  Upload, FileText, Image as ImageIcon, FileType, File as FileIcon,
  Loader2, Trash2, AlertCircle, Check, Info, X, Tag,
} from 'lucide-react';

// ─── Types (mirror backend) ────────────────────────────────────────────

type UploadKind = 'image' | 'pdf' | 'text' | 'other';

interface UploadRecord {
  id: string;
  user_id: string;
  filename: string;
  kind: UploadKind;
  size_bytes: number;
  concept_tags: string[];
  uploaded_at: string;
  extracted_text?: string | null;
  note?: string;
}

interface UploadListResponse {
  uploads: UploadRecord[];
  count: number;
}

// ─── Size limits ───────────────────────────────────────────────────────

// Server accepts 10 MB of JSON request body. Base64 adds ~33% overhead
// on binary files, so effective binary ceiling is ~7.5 MB. Advertise the
// tighter number so users don't hit a confusing server error.
const MAX_BINARY_SIZE_BYTES = 7.5 * 1024 * 1024;

// ─── Known concept IDs the router recognises ──────────────────────────
// Mirrors the map in src/content/router.ts#extractConceptId. Showing
// these as suggestion chips saves the user from guessing exact strings.

const KNOWN_CONCEPT_IDS = [
  'calculus-derivatives',
  'calculus-integration',
  'calculus-limits',
  'linear-algebra-eigenvalues',
  'linear-algebra-matrices',
  'complex-numbers',
  'probability-basics',
  'vectors-3d',
  'trigonometry',
  'algebra-basics',
];

// ─── Helpers ───────────────────────────────────────────────────────────

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function iconForKind(kind: UploadKind) {
  switch (kind) {
    case 'image': return ImageIcon;
    case 'pdf': return FileType;
    case 'text': return FileText;
    default: return FileIcon;
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

/**
 * Convert a File to a base64 string (without the data: URL prefix).
 * Falls back gracefully on errors.
 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error("couldn't read file"));
        return;
      }
      // result is "data:<mime>;base64,<base64>" — strip the prefix
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

// ─── Upload zone (drag-and-drop + click) ──────────────────────────────

interface UploadZoneProps {
  onFileChosen: (file: File) => void;
  disabled: boolean;
}

function UploadZone({ onFileChosen, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileChosen(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop a file here or click to select"
      onKeyDown={e => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`
        rounded-lg border-2 border-dashed p-8 text-center cursor-pointer
        transition-colors
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${isDragging
          ? 'border-sky-500 bg-sky-950/30'
          : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'}
      `}
    >
      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
      <p className="text-slate-200 font-medium">
        Drop a file here, or click to select
      </p>
      <p className="text-xs text-slate-500 mt-2">
        Images · PDFs · Text notes · up to 7.5 MB each
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
          // Reset so the same file can be re-selected after a delete
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Upload-details form (shown after a file is chosen, before submit)

interface UploadDetailsProps {
  file: File;
  onSubmit: (note: string, conceptTags: string[]) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}

function UploadDetails({ file, onSubmit, onCancel, submitting, error }: UploadDetailsProps) {
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [conceptTags, setConceptTags] = useState<string[]>([]);

  const addTag = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    if (conceptTags.includes(trimmed)) return;
    setConceptTags([...conceptTags, trimmed]);
    setTagInput('');
  };

  const removeTag = (t: string) => setConceptTags(conceptTags.filter(x => x !== t));

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && conceptTags.length) {
      setConceptTags(conceptTags.slice(0, -1));
    }
  };

  const suggestions = KNOWN_CONCEPT_IDS.filter(id => !conceptTags.includes(id));

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5 space-y-4">
      {/* Selected file summary */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
        <FileIcon className="w-5 h-5 text-slate-400" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Cancel upload"
          className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="note-input">
          Note <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="note-input"
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          disabled={submitting}
          placeholder="e.g. Class notes from Oct 15 on derivatives"
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-600"
        />
      </div>

      {/* Concept tags */}
      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="tag-input">
          Concept tags <span className="text-slate-500">(enter or comma to add)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Tags help the content router find this upload when you later ask about a topic.
        </p>

        {/* Existing tag chips */}
        {conceptTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {conceptTags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded"
              >
                <Tag className="w-3 h-3" />
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  aria-label={`Remove tag ${t}`}
                  disabled={submitting}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          id="tag-input"
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKey}
          onBlur={() => tagInput && addTag(tagInput)}
          disabled={submitting}
          placeholder="calculus-derivatives"
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-600"
        />

        {/* Known-concept suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-1">Known concepts:</p>
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(0, 8).map(id => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addTag(id)}
                  disabled={submitting}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-700"
                >
                  + {id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-300 bg-red-950/30 border border-red-900/50 rounded-md p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-sm px-3 py-1.5 text-slate-300 hover:text-white disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit(note, conceptTags)}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 text-sm bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-md disabled:opacity-60 disabled:cursor-wait"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {submitting ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

// ─── Uploads list (existing uploads) ──────────────────────────────────

interface UploadsListProps {
  uploads: UploadRecord[];
  onDelete: (id: string) => Promise<void>;
  deletingId: string | null;
  deleteErrors: Record<string, string>;
}

function UploadsList({ uploads, onDelete, deletingId, deleteErrors }: UploadsListProps) {
  if (uploads.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 border-dashed bg-slate-800/20 p-8 text-center">
        <FileIcon className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No uploads yet</p>
        <p className="text-slate-600 text-xs mt-1">
          Files you upload here stay private to your account.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {uploads.map(u => {
        const Icon = iconForKind(u.kind);
        const isDeleting = deletingId === u.id;
        const err = deleteErrors[u.id];
        return (
          <li
            key={u.id}
            className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 flex items-start gap-3"
          >
            <Icon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium truncate">{u.filename}</span>
                <span className="text-xs text-slate-500">{formatBytes(u.size_bytes)}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">{formatTime(u.uploaded_at)}</span>
              </div>

              {u.note && (
                <p className="text-sm text-slate-300 mt-1 line-clamp-2">{u.note}</p>
              )}

              {u.concept_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {u.concept_tags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {err && (
                <p className="text-xs text-red-300 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {err}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDelete(u.id)}
              disabled={isDeleting}
              aria-label={`Delete ${u.filename}`}
              className="flex-shrink-0 p-1.5 text-slate-500 hover:text-red-400 disabled:opacity-40"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─── The page ─────────────────────────────────────────────────────────

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justUploadedId, setJustUploadedId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  // ─── Initial load ────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const resp = await authFetch('/api/student/uploads');
      if (!resp.ok) throw new Error(`failed (${resp.status})`);
      const data: UploadListResponse = await resp.json();
      setUploads(data.uploads);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || 'failed to load uploads');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fade the "just uploaded" success highlight after a few seconds
  useEffect(() => {
    if (!justUploadedId) return;
    const t = setTimeout(() => setJustUploadedId(null), 4000);
    return () => clearTimeout(t);
  }, [justUploadedId]);

  // ─── File chosen — validate size client-side ────────────────────────

  const handleFileChosen = (file: File) => {
    setSubmitError(null);
    if (file.size > MAX_BINARY_SIZE_BYTES) {
      setPendingFile(null);
      setSubmitError(
        `File is ${formatBytes(file.size)} — the effective limit is ` +
        `${formatBytes(MAX_BINARY_SIZE_BYTES)} (base64 encoding adds ` +
        `about 33% overhead on a 10 MB server limit). Try compressing ` +
        `or splitting the file.`,
      );
      return;
    }
    setPendingFile(file);
  };

  // ─── Submit ──────────────────────────────────────────────────────────

  const handleSubmit = async (note: string, conceptTags: string[]) => {
    if (!pendingFile) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body_base64 = await readFileAsBase64(pendingFile);
      const resp = await authFetch('/api/student/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: pendingFile.name,
          body_base64,
          note: note || undefined,
          concept_tags: conceptTags.length ? conceptTags : undefined,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`server returned ${resp.status}${txt ? `: ${txt.slice(0, 120)}` : ''}`);
      }
      const record: UploadRecord = await resp.json();

      // Prepend the new upload optimistically
      setUploads(prev => prev ? [record, ...prev] : [record]);
      setJustUploadedId(record.id);
      setPendingFile(null);
      setSubmitError(null);
    } catch (e: any) {
      setSubmitError(e?.message || 'upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteErrors(prev => { const p = { ...prev }; delete p[id]; return p; });

    // Optimistic removal
    const snapshot = uploads;
    if (uploads) setUploads(uploads.filter(u => u.id !== id));

    try {
      const resp = await authFetch(`/api/student/uploads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`server returned ${resp.status}${txt ? `: ${txt.slice(0, 120)}` : ''}`);
      }
    } catch (e: any) {
      // Roll back
      setUploads(snapshot);
      setDeleteErrors(prev => ({ ...prev, [id]: e?.message || 'delete failed' }));
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-sky-400" />
          Your uploads
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Upload class notes, problem photos, or reference PDFs. The content router
          can find them when you later ask about a tagged topic.
        </p>
      </div>

      {/* Privacy banner — constitutional constraint made visible */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 flex gap-2 items-start text-xs text-slate-400">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          Uploads are private to your account. They never enter cohort analysis, are
          never sent to an LLM or Wolfram without your per-request consent, and are
          deleted if you close your account.
        </div>
      </div>

      {/* Upload section — zone or details form */}
      {pendingFile ? (
        <UploadDetails
          file={pendingFile}
          submitting={submitting}
          error={submitError}
          onSubmit={handleSubmit}
          onCancel={() => { setPendingFile(null); setSubmitError(null); }}
        />
      ) : (
        <>
          <UploadZone onFileChosen={handleFileChosen} disabled={submitting} />
          {submitError && !pendingFile && (
            <div className="flex items-start gap-2 text-sm text-red-300 bg-red-950/30 border border-red-900/50 rounded-md p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}
        </>
      )}

      {/* Success highlight */}
      {justUploadedId && (
        <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 rounded-md p-3">
          <Check className="w-4 h-4" />
          <span>Upload added.</span>
        </div>
      )}

      {/* Uploads list */}
      <section className="space-y-2">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">
            {uploads ? `${uploads.length} upload${uploads.length === 1 ? '' : 's'}` : 'Uploads'}
          </h2>
        </header>

        {loadError && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-950/30 border border-red-900/50 rounded-md p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>Couldn't load uploads: {loadError}</span>
              <button
                onClick={refresh}
                className="ml-2 underline hover:text-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {uploads === null && !loadError ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your uploads…
          </div>
        ) : uploads ? (
          <UploadsList
            uploads={uploads}
            onDelete={handleDelete}
            deletingId={deletingId}
            deleteErrors={deleteErrors}
          />
        ) : null}
      </section>
    </div>
  );
}
