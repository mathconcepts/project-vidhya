// @ts-nocheck
/**
 * src/content-studio/sources/uploads.ts
 *
 * Source adapter: uploads.
 *
 * Pulls content from the admin's previously-uploaded files (PDFs,
 * images with extracted text, plain text). Highest fidelity if a
 * relevant upload exists; free.
 *
 * Strategy:
 *   - If GenerationRequest.source_upload_id is set, use that exact
 *     upload's extracted_text
 *   - Otherwise, find all uploads tagged with concept_id (via
 *     findUploadsByConcept) and concatenate their extracted_text
 *   - Returns null if no upload found OR no extracted_text on any
 *     of them (an unprocessed PDF is no use without OCR)
 *
 * The body returned is the raw extracted text — admin will edit it
 * down in the studio review UI before approving.
 */

import { getUpload, findUploadsByConcept } from '../../content/uploads';
import type { GenerationRequest } from '../types';

export interface AdapterResult {
  body:   string;            // The proposed explainer_md body
  detail: string;            // Short description for the audit trail
  worked_example?: string;   // Optional worked example body
}

export async function tryUploadsSource(
  req: GenerationRequest,
  actor_id: string,
): Promise<AdapterResult | null> {
  // Specific upload requested
  if (req.source_upload_id) {
    const upload = getUpload(actor_id, req.source_upload_id);
    if (!upload) return null;
    if (!upload.extracted_text || !upload.extracted_text.trim()) return null;
    return {
      body: formatBody(upload.extracted_text, req.title),
      detail: `from upload ${upload.id} (${upload.filename}, ${upload.size_bytes}B)`,
    };
  }

  // Otherwise, find uploads tagged with this concept
  const matches = findUploadsByConcept(actor_id, req.concept_id);
  const with_text = matches.filter(u => u.extracted_text && u.extracted_text.trim());
  if (with_text.length === 0) return null;

  // Concatenate, separating with a horizontal rule
  const combined = with_text
    .map(u => `## From: ${u.filename}\n\n${u.extracted_text!.trim()}`)
    .join('\n\n---\n\n');

  return {
    body: formatBody(combined, req.title),
    detail: `combined ${with_text.length} upload(s): ${with_text.map(u => u.filename).join(', ')}`,
  };
}

function formatBody(raw_text: string, title: string): string {
  // If the raw text already looks like markdown with a title, return as-is
  const trimmed = raw_text.trim();
  if (/^#\s+/.test(trimmed)) return trimmed;
  // Otherwise, prepend a title
  return `# ${title}\n\n${trimmed}`;
}
