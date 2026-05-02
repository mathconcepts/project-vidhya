// @ts-nocheck
/**
 * generate-demo-audio.ts — one-time TTS generation for the demo.
 *
 * Run this once with OPENAI_API_KEY set to populate demo/seed-audio/ with
 * MP3s for every narratable demo atom. Check the resulting files into
 * source so the demo deploy ships audio without needing API keys at boot.
 *
 * Cost: ~$0.005 per atom at OpenAI tts-1. ~3 atoms = $0.015 one-time.
 *
 *   OPENAI_API_KEY=sk-... npm run demo:generate-audio
 *
 * Re-runs are idempotent — the file gets overwritten if you change voice
 * or model. Commit the result so production deploys never call the API.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  shouldNarrate,
  generateNarration,
} from '../src/content/concept-orchestrator/tts-generator.ts';

const REPO_ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..');
const CONTENT_ROOT = path.join(REPO_ROOT, 'modules', 'project-vidhya-content', 'concepts');
const SEED_AUDIO_DIR = path.join(REPO_ROOT, 'demo', 'seed-audio');

interface AtomFile {
  id: string;
  atom_type: string;
  body: string;
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
  return { id: fm.id, atom_type: fm.atom_type, body: m[2] };
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

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not set. Set it and re-run.');
    process.exit(1);
  }
  // Force-enable the TTS path (the runtime gates on TTS_PROVIDER for safety).
  process.env.TTS_PROVIDER = process.env.TTS_PROVIDER ?? 'openai';

  fs.mkdirSync(SEED_AUDIO_DIR, { recursive: true });
  const atoms = walkAtoms();
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let totalCost = 0;

  for (const atom of atoms) {
    if (!shouldNarrate(atom.atom_type)) { skipped++; continue; }
    const dest = path.join(SEED_AUDIO_DIR, `${atom.id}.mp3`);
    try {
      const r = await generateNarration(atom.atom_type, atom.body);
      if (!r) { console.warn(`  skipped ${atom.id} (returned null)`); skipped++; continue; }
      fs.writeFileSync(dest, r.buffer);
      console.log(`  generated ${atom.id} → ${dest} (${r.buffer.length} bytes, ~$${r.cost_usd_estimate.toFixed(5)})`);
      totalCost += r.cost_usd_estimate;
      generated++;
    } catch (err) {
      console.warn(`  failed ${atom.id}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(
    `\ndemo:generate-audio complete: ${generated} generated, ${skipped} skipped (non-narratable atom_type), ${failed} failed.`,
  );
  console.log(`Total cost: ~$${totalCost.toFixed(4)}.`);
  console.log(`Files in ${SEED_AUDIO_DIR}/ — commit them so production deploys ship audio without API keys.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
