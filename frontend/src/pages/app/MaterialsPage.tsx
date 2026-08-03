/**
 * MaterialsPage — student-uploaded study materials.
 *
 * Upload PDFs, DOCX, markdown, or handwritten images. Parsed client-side
 * (except vision OCR), embedded via transformers.js, stored in IndexedDB.
 * Retrieved as grounding context during chat.
 *
 * This is the headline DB-less feature: privacy-first personalization.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import {
  Upload, FileText, Image as ImageIcon, FileCode, Trash2, Loader2,
  CheckCircle2, AlertCircle, Shield, Sparkles, BookOpen,
} from 'lucide-react';
import {
  ingestMaterial,
} from '@/lib/gbrain/materials';
import {
  getAllMaterials, deleteMaterial, getChunksForMaterial,
  type GBrainDB,
} from '@/lib/gbrain/db';
import { warmup as warmupEmbedder } from '@/lib/gbrain/embedder';

type Material = GBrainDB['materials']['value'];

const ACCEPTED = '.pdf,.docx,.md,.txt,image/*';

const TYPE_ICONS: Record<Material['type'], typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  md: FileCode,
  txt: FileCode,
  'image-notes': ImageIcon,
  'image-work': ImageIcon,
};

const TYPE_STYLES: Record<Material['type'], { iconColor: string; bg: string }> = {
  pdf: { iconColor: 'var(--red)', bg: 'rgba(255,59,48,.08)' },
  docx: { iconColor: 'var(--indigo-ink)', bg: 'rgba(88,86,214,.08)' },
  md: { iconColor: 'var(--indigo-ink)', bg: 'rgba(88,86,214,.08)' },
  txt: { iconColor: 'var(--text-tertiary)', bg: 'var(--surface-fill)' },
  'image-notes': { iconColor: 'var(--green-ink)', bg: 'rgba(52,199,89,.08)' },
  'image-work': { iconColor: 'var(--orange)', bg: 'rgba(255,159,10,.08)' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ filename: string; stage: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [chunkCounts, setChunkCounts] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllMaterials();
      all.sort((a, b) => (b.uploaded_at > a.uploaded_at ? 1 : -1));
      setMaterials(all);
      const counts: Record<string, number> = {};
      for (const m of all) {
        const chunks = await getChunksForMaterial(m.id);
        counts[m.id] = chunks.length;
      }
      setChunkCounts(counts);
    } catch (err) {
      setError(`Failed to load materials: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: 'materials' });
    loadMaterials();
    warmupEmbedder().catch(() => {});
  }, [loadMaterials]);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading({ filename: file.name, stage: 'starting', pct: 0 });
    try {
      await ingestMaterial(file, (stage, pct) => {
        setUploading({ filename: file.name, stage, pct });
      });
      trackEvent('material_uploaded', { type: file.type, size: file.size });
      setUploading(null);
      await loadMaterials();
    } catch (err) {
      setError(`Upload failed: ${(err as Error).message}`);
      setUploading(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material and its embeddings? This cannot be undone.')) return;
    await deleteMaterial(id);
    await loadMaterials();
    trackEvent('material_deleted', { id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} style={{ color: 'var(--green-ink)' }} />
          Your Materials
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
          Upload notes, textbooks, handwritten work. GBrain learns from them.
        </p>
      </div>

      {/* Privacy banner */}
      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.22)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Shield size={14} style={{ color: 'var(--green-ink)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
          <span style={{ color: 'var(--green-ink)', fontWeight: 'var(--weight-semibold)' }}>Privacy-first.</span>{' '}
          Files are parsed and embedded entirely in your browser. Only handwritten
          images briefly touch the server for OCR. Your materials never leave your device.
        </div>
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        style={{
          position: 'relative', padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center',
          border: `2px dashed ${dragActive ? 'var(--green)' : 'var(--separator)'}`,
          background: dragActive ? 'rgba(52,199,89,.04)' : 'var(--surface-card)',
          transition: 'border-color 0.15s, background 0.15s',
          pointerEvents: uploading ? 'none' : 'auto',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Loader2 style={{ color: 'var(--green-ink)' }} size={24} className="animate-spin" />
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{uploading.filename}</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{uploading.stage}</p>
            <div style={{ maxWidth: 280, width: '100%', height: 6, borderRadius: 999, background: 'var(--surface-fill)', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'var(--green)', borderRadius: 999 }}
                animate={{ width: `${Math.round(uploading.pct * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
            <p style={{ margin: '0 0 4px', fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>
              Drop a file here or{' '}
              <button onClick={() => inputRef.current?.click()} style={{ color: 'var(--green-ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}>browse</button>
            </p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>
              PDF, DOCX, Markdown, TXT, or images (up to ~50 MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,59,48,.06)', border: '1px solid rgba(255,59,48,.22)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 11, color: 'var(--red)' }}>{error}</p>
        </motion.div>
      )}

      {/* Grounding indicator */}
      {materials.length > 0 && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(88,86,214,.05)', border: '1px solid rgba(88,86,214,.22)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} style={{ color: 'var(--indigo-ink)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--indigo-ink)' }}>{materials.length}</span> material{materials.length === 1 ? '' : 's'} ·{' '}
            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--indigo-ink)' }}>
              {Object.values(chunkCounts).reduce((a, b) => a + b, 0)}
            </span>{' '}
            chunks ready for chat grounding
          </p>
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 64, borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)' }} className="animate-pulse" />)}
        </div>
      ) : materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <BookOpen size={32} style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>No materials yet. Upload your first file above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence>
            {materials.map(m => {
              const Icon = TYPE_ICONS[m.type];
              const ts = TYPE_STYLES[m.type];
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}
                >
                  <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: ts.bg }}>
                    <Icon size={14} style={{ color: ts.iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.filename}</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {formatBytes(m.size_bytes)}
                      {m.page_count ? ` · ${m.page_count} pages` : ''}
                      {chunkCounts[m.id] !== undefined ? ` · ${chunkCounts[m.id]} chunks` : ''}
                      {' · '}
                      {formatDate(m.uploaded_at)}
                    </p>
                  </div>
                  <CheckCircle2 size={14} style={{ color: 'var(--green-ink)', flexShrink: 0 }} />
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{ padding: 6, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Delete material"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tip */}
      {materials.length > 0 && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: 'var(--hairline) solid var(--separator)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tip</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
            Ask the tutor about your materials — e.g. "Explain the chain rule example from my notes"
            or "Generate practice problems like the ones in chapter 3". GBrain will automatically
            pull the most relevant chunks.
          </p>
        </div>
      )}
    </div>
  );
}
