// @ts-nocheck
/**
 * Atom Responder — serves pre-authored atom files as chat responses.
 *
 * When the task reasoner identifies a concept + pedagogical action that maps
 * to one of the 82 pre-authored Engineering Math atom files, this module
 * reads that file and streams it as the chat response — no live LLM call
 * needed.
 *
 * Resolution order for atom type:
 *   worked_example / challenge_stretch → worked-example.md
 *   scaffolded_hint / prerequisite_repair / emotional_support → intuition.md
 *   socratic_questioning / progress_reflection → retrieval-prompt.md
 *   error_diagnosis → common-traps.md
 *   confidence_building → micro-exercise.md
 *   strategy_coaching → formal-definition.md
 *   (no explicit mapping) → visual-analogy.md → hook.md → any available atom
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PedagogicalAction } from '../gbrain/task-reasoner';

const ATOMS_BASE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../modules/project-vidhya-content/concepts',
);

// Maps PedagogicalAction to preferred atom file names, in priority order.
const ACTION_TO_ATOM_FILES: Record<PedagogicalAction, string[]> = {
  worked_example:       ['worked-example.md', 'formal-definition.md', 'intuition.md'],
  challenge_stretch:    ['worked-example.md', 'micro-exercise.md'],
  scaffolded_hint:      ['intuition.md', 'hook.md', 'visual-analogy.md'],
  prerequisite_repair:  ['intuition.md', 'formal-definition.md', 'hook.md'],
  emotional_support:    ['hook.md', 'intuition.md', 'visual-analogy.md'],
  socratic_questioning: ['retrieval-prompt.md', 'micro-exercise.md'],
  progress_reflection:  ['retrieval-prompt.md', 'micro-exercise.md'],
  error_diagnosis:      ['common-traps.md', 'worked-example.md'],
  confidence_building:  ['micro-exercise.md', 'retrieval-prompt.md', 'intuition.md'],
  strategy_coaching:    ['formal-definition.md', 'worked-example.md'],
};

const FALLBACK_ORDER = [
  'worked-example.md',
  'intuition.md',
  'hook.md',
  'formal-definition.md',
  'visual-analogy.md',
  'micro-exercise.md',
  'retrieval-prompt.md',
  'common-traps.md',
];

/**
 * Normalise a concept name or id to a filesystem slug.
 * "Matrix Operations" → "matrix-operations"
 * "matrix-operations" → "matrix-operations"
 */
function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Given a raw concept identifier (may be a label like "Matrix Operations" or
 * an id like "matrix-operations"), return the directory path if it exists.
 */
function resolveConceptDir(conceptId: string): string | null {
  const slug = toSlug(conceptId);
  const direct = path.join(ATOMS_BASE, slug);
  if (fs.existsSync(direct)) return direct;

  // Try partial match — concept id might be "Linear Algebra > Matrix Operations"
  // or contain a subtopic separator. Strip everything before the last separator.
  const parts = slug.split(/[-_\/]/);
  if (parts.length > 1) {
    // Try longest suffix combinations
    for (let i = 1; i < parts.length; i++) {
      const candidate = parts.slice(i).join('-');
      const dir = path.join(ATOMS_BASE, candidate);
      if (fs.existsSync(dir)) return dir;
    }
    // Try joining all parts (already done above), but also try fuzzy:
    // Find any concept dir whose id contains every word from the slug
    const words = slug.split('-').filter(w => w.length > 2);
    if (words.length > 0) {
      try {
        const dirs = fs.readdirSync(ATOMS_BASE);
        const match = dirs.find(d => words.every(w => d.includes(w)));
        if (match) return path.join(ATOMS_BASE, match);
      } catch { /* ignore */ }
    }
  }
  return null;
}

/**
 * Strip YAML frontmatter (--- ... ---) from atom file content.
 */
function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return content;
  return content.slice(end + 4).trimStart();
}

export interface AtomResult {
  conceptId: string;
  atomType: string;
  content: string;
}

/**
 * Resolve and read an atom file. Returns null when no matching atom exists
 * (caller falls through to live LLM).
 */
export function resolveAtom(
  conceptId: string | null | undefined,
  action: PedagogicalAction | null | undefined,
): AtomResult | null {
  if (!conceptId) return null;

  const conceptDir = resolveConceptDir(conceptId);
  if (!conceptDir) return null;

  const atomsDir = path.join(conceptDir, 'atoms');
  if (!fs.existsSync(atomsDir)) return null;

  const preferredFiles = action
    ? (ACTION_TO_ATOM_FILES[action] ?? FALLBACK_ORDER)
    : FALLBACK_ORDER;

  for (const fileName of preferredFiles) {
    const filePath = path.join(atomsDir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const content = stripFrontmatter(raw);
        if (!content.trim()) continue;
        const atomType = fileName.replace('.md', '');
        return {
          conceptId: path.basename(conceptDir),
          atomType,
          content,
        };
      } catch { /* skip unreadable files */ }
    }
  }
  return null;
}

/**
 * Stream atom content as SSE chunks to mimic live LLM streaming.
 * Sends chunks of ~100 chars with a small delay so the UI renders
 * progressively (not one giant flash).
 */
export async function* streamAtomContent(content: string): AsyncGenerator<string> {
  const CHUNK_SIZE = 100;
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    yield content.slice(i, i + CHUNK_SIZE);
    // Small yield to allow the event loop to breathe between chunks
    await new Promise(r => setTimeout(r, 8));
  }
}
