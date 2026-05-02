// @ts-nocheck
/**
 * media-routes.ts — serves multi-modal sidecars (§4.15).
 *
 *   GET /api/lesson/media/:atom_id/:kind
 *     Returns the active version's media file for (atom_id, kind).
 *     kind ∈ {gif, audio_narration}.
 *     200 with proper content-type when found.
 *     404 when no active artifact exists.
 *
 * The route is public (no auth) because lesson content is anonymous-first
 * by design (matches the existing lesson-routes contract). If we add
 * paywalled content later, this route gets the same auth-middleware
 * pattern as the rest of /api/lesson/*.
 *
 * Path traversal defense: src_path comes from the DB, which the orchestrator
 * controls via `pathForArtifact()`. We additionally verify the resolved
 * file lives under MEDIA_STORAGE_DIR before serving. Belt-and-suspenders
 * since the DB is the trust boundary.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ServerResponse } from 'http';
import { getActiveArtifact, MEDIA_STORAGE_DIR, type MediaKind } from '../content/concept-orchestrator';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendError } from '../lib/route-helpers';

const ALLOWED_KINDS: MediaKind[] = ['gif', 'audio_narration'];
const CONTENT_TYPE: Record<MediaKind, string> = {
  gif: 'image/gif',
  audio_narration: 'audio/mpeg',
};

async function handleMedia(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const params = (req.params as any) || {};
  const atom_id = params.atom_id as string | undefined;
  const kind = params.kind as MediaKind | undefined;
  if (!atom_id || !kind || !ALLOWED_KINDS.includes(kind)) {
    return sendError(res, 400, `kind must be one of ${ALLOWED_KINDS.join(', ')}`);
  }

  const artifact = await getActiveArtifact(atom_id, kind);
  // DB-less fallback: no DATABASE_URL means getActiveArtifact returns null,
  // but pre-rendered sidecars from demo/seed-media.ts still live on disk
  // at MEDIA_STORAGE_DIR/{atom_id}.v*.{ext}. Walk the dir for highest v.
  const resolved = artifact
    ? path.resolve(artifact.src_path)
    : resolveLatestOnDisk(atom_id, kind);
  if (!resolved) return sendError(res, 404, 'no active artifact');

  // Path traversal defense — resolve to absolute and verify it's under
  // MEDIA_STORAGE_DIR. Even though src_path comes from our own
  // pathForArtifact(), guard against future bugs.
  const allowedRoot = path.resolve(MEDIA_STORAGE_DIR);
  if (!resolved.startsWith(allowedRoot + path.sep) && resolved !== allowedRoot) {
    console.warn(`[media-routes] path escape blocked: ${resolved}`);
    return sendError(res, 404, 'no active artifact');
  }
  if (!fs.existsSync(resolved)) {
    return sendError(res, 404, 'artifact file missing on disk');
  }

  const stat = fs.statSync(resolved);
  res.writeHead(200, {
    'Content-Type': CONTENT_TYPE[kind],
    'Content-Length': String(stat.size),
    // Cache for 1 hour — versioned URL means the next regen produces a
    // new path so cache busting happens automatically.
    'Cache-Control': 'public, max-age=3600',
  });
  const stream = fs.createReadStream(resolved);
  stream.pipe(res);
}

/** Walk MEDIA_STORAGE_DIR for the highest-version file matching (atom_id, kind). */
function resolveLatestOnDisk(atom_id: string, kind: MediaKind): string | null {
  const ext = kind === 'gif' ? 'gif' : 'mp3';
  const dir = path.resolve(MEDIA_STORAGE_DIR);
  if (!fs.existsSync(dir)) return null;
  let bestV = -1;
  let best: string | null = null;
  // Escape regex metacharacters in atom_id since IDs contain dots.
  const escAtom = atom_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escAtom}\\.v(\\d+)\\.${ext}$`);
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(re);
    if (!m) continue;
    const v = parseInt(m[1], 10);
    if (v > bestV) { bestV = v; best = path.join(dir, f); }
  }
  return best;
}

export const mediaRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/lesson/media/:atom_id/:kind', handler: handleMedia },
];
