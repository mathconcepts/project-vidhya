/**
 * seed-media.ts — pre-render demo GIFs from static visual_analogy atoms.
 *
 * Why this exists: §4.15 multi-modal generation renders sidecar GIFs at
 * atom-generation time inside the orchestrator. The demo deploy doesn't
 * run the orchestrator (no LLM key required for the demo baseline), so
 * without this script there are zero GIFs to display.
 *
 * What it does:
 *   1. Walks modules/project-vidhya-content/concepts/.../atoms/*.md
 *   2. For every visual_analogy atom whose body contains a fenced
 *      `gif-scene` JSON block, renders the GIF synchronously
 *   3. Writes the result to .data/media/{atom_id}.v1.gif
 *
 * Idempotent: re-running overwrites existing files. Safe in Render's
 * boot CMD ("npm run demo:seed && npm run demo:seed-media && tsx ...").
 *
 * Disk-based discovery in atom-loader picks up these files when no DB
 * is configured, attaching gif_url to the atom payload at lesson load.
 */

import fs from 'node:fs';
import path from 'node:path';
import { renderScene, type SceneDescription } from '../src/content/concept-orchestrator/gif-generator.ts';

const REPO_ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const CONTENT_ROOT = path.join(REPO_ROOT, 'modules', 'project-vidhya-content', 'concepts');
const MEDIA_DIR = process.env.MEDIA_STORAGE_DIR ?? path.join(REPO_ROOT, '.data', 'media');

interface AtomFile {
  id: string;
  atom_type: string;
  body: string;
  path: string;
}

function parseAtomFile(p: string): AtomFile | null {
  const raw = fs.readFileSync(p, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  if (!fm.id || !fm.atom_type) return null;
  return { id: fm.id, atom_type: fm.atom_type, body: m[2], path: p };
}

function extractGifScene(body: string): SceneDescription | null {
  const m = body.match(/```gif-scene\s*\n([\s\S]*?)\n```/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    if (parsed?.type === 'parametric' || parsed?.type === 'function-trace') return parsed as SceneDescription;
  } catch { /* malformed — skip */ }
  return null;
}

function walkAtoms(): AtomFile[] {
  const out: AtomFile[] = [];
  if (!fs.existsSync(CONTENT_ROOT)) return out;
  for (const concept of fs.readdirSync(CONTENT_ROOT)) {
    const atomsDir = path.join(CONTENT_ROOT, concept, 'atoms');
    if (!fs.existsSync(atomsDir)) continue;
    for (const f of fs.readdirSync(atomsDir)) {
      if (!f.endsWith('.md')) continue;
      const parsed = parseAtomFile(path.join(atomsDir, f));
      if (parsed) out.push(parsed);
    }
  }
  return out;
}

/**
 * Copy any pre-generated MP3s from demo/seed-audio/ into MEDIA_DIR. The
 * disk fallback in atom-loader picks them up by atom_id.v*.mp3 naming.
 *
 * Why pre-generated: TTS costs ~$0.005/atom and requires OPENAI_API_KEY at
 * build time. Operators run `npm run demo:generate-audio` once with their
 * key to populate demo/seed-audio/, then check the MP3s into source.
 * Demo deploy boots without API keys and audio still ships.
 */
function copySeedAudio(): { copied: number; missing: boolean } {
  const seedDir = path.join(REPO_ROOT, 'demo', 'seed-audio');
  if (!fs.existsSync(seedDir)) return { copied: 0, missing: true };
  let copied = 0;
  for (const f of fs.readdirSync(seedDir)) {
    if (!f.endsWith('.mp3')) continue;
    // Source naming: {atom_id}.mp3. Destination naming: {atom_id}.v1.mp3
    // (matches the disk-fallback regex in atom-loader + media-routes).
    const atomId = f.replace(/\.mp3$/, '');
    const dest = path.join(MEDIA_DIR, `${atomId}.v1.mp3`);
    fs.copyFileSync(path.join(seedDir, f), dest);
    console.log(`  copied audio ${atomId} → ${dest}`);
    copied++;
  }
  return { copied, missing: false };
}

function main(): void {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const atoms = walkAtoms();
  let rendered = 0;
  let skipped = 0;
  let failed = 0;
  for (const atom of atoms) {
    if (atom.atom_type !== 'visual_analogy') continue;
    const scene = extractGifScene(atom.body);
    if (!scene) { skipped++; continue; }
    const outPath = path.join(MEDIA_DIR, `${atom.id}.v1.gif`);
    try {
      const result = renderScene(scene);
      fs.writeFileSync(outPath, result.buffer);
      console.log(`  rendered ${atom.id} → ${outPath} (${result.buffer.length} bytes)`);
      rendered++;
    } catch (err) {
      console.warn(`  failed ${atom.id}: ${(err as Error).message}`);
      failed++;
    }
  }
  const audio = copySeedAudio();
  console.log(
    `\nseed-media: ${rendered} GIFs rendered, ${audio.copied} audio files copied${audio.missing ? ' (demo/seed-audio/ missing)' : ''}, ${skipped} GIFs skipped (no gif-scene block), ${failed} failed.`,
  );
}

main();
