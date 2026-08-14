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

// Generic words that appear in many concept slugs and don't help disambiguate.
// Excluded from the score denominator so only the specific words must match.
const SKIP_WORDS = new Set([
  'basic', 'basics', 'first', 'second', 'higher', 'lower',
  'order', 'simple', 'advanced', 'general',
]);

// Regex-based overrides for concepts whose names are abbreviated or highly
// ambiguous (e.g. "ODE" alone could mean any of six ODE concepts).
const KEYWORD_OVERRIDES: Array<[RegExp, string]> = [
  [/\bpde\b|partial.differential.equation/i, 'pde-basics'],
  [/ordinary.differential|ode.first|first.order.ode/i, 'ode-first-order'],
  [/bernoulli.ode|ode.bernoulli/i, 'ode-bernoulli'],
  [/exact.ode|ode.exact/i, 'ode-exact'],
  [/higher.order.ode|ode.higher/i, 'ode-higher-order'],
  [/homogeneous.ode|second.order.homo/i, 'ode-second-order-homo'],
  [/non.?homogeneous|inhomogeneous/i, 'ode-second-order-nonhomo'],
  [/\bode\b/i, 'ode-first-order'], // bare "ODE" → intro concept
  [/normal.distribution|gaussian|continuous.distribution/i, 'continuous-distributions'],
  [/binomial|poisson|discrete.distribution/i, 'discrete-distributions'],
  [/euler.hamilton|hamiltonian.path|eulerian.circuit/i, 'euler-hamilton'],
  [/inverse.laplace/i, 'inverse-laplace'],
  [/laplace.application|laplace.ode/i, 'laplace-applications'],
  [/z.transform/i, 'z-transform'],
  [/inverse.z/i, 'z-transform'],
];

/**
 * Resolve an atom by scanning the raw user message for concept keywords.
 * Used when the task reasoner's selected_concept is null (heuristic path).
 *
 * Scoring: for each concept directory, count how many of its "meaningful"
 * slug words (non-generic ones) appear in the message. The concept with the
 * highest fraction of meaningful words matched wins, provided at least one
 * meaningful word matched.
 */
export function resolveAtomFromMessage(
  message: string,
  action: PedagogicalAction | null | undefined,
): AtomResult | null {
  if (!message?.trim()) return null;

  // Regex overrides first — handles abbreviated/ambiguous concept names.
  for (const [pattern, conceptId] of KEYWORD_OVERRIDES) {
    if (pattern.test(message)) {
      const result = resolveAtom(conceptId, action);
      if (result) return result;
    }
  }

  // Normalise message to a word array.
  const lower = message.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const msgWords = lower.split(/\s+/).filter(w => w.length > 1);
  if (msgWords.length === 0) return null;

  const wordMatches = (cw: string) =>
    msgWords.some(mw => mw === cw || mw.startsWith(cw) || cw.startsWith(mw));

  let bestScore = 0;
  let bestMatchedCount = 0;
  let bestLen = Infinity;
  let bestConceptId: string | null = null;

  let dirs: string[];
  try {
    dirs = fs.readdirSync(ATOMS_BASE);
  } catch { return null; }

  for (const dir of dirs) {
    if (!fs.existsSync(path.join(ATOMS_BASE, dir, 'atoms'))) continue;

    const allWords = dir.split('-').filter(w => w.length > 1);
    const meaningful = allWords.filter(w => !SKIP_WORDS.has(w));
    const denominator = meaningful.length || allWords.length;

    const meaningfulMatched = meaningful.filter(wordMatches).length;
    if (meaningfulMatched === 0) continue;

    const score = meaningfulMatched / denominator;

    if (
      score > bestScore ||
      (score === bestScore && meaningfulMatched > bestMatchedCount) ||
      (score === bestScore && meaningfulMatched === bestMatchedCount && dir.length < bestLen)
    ) {
      bestScore = score;
      bestMatchedCount = meaningfulMatched;
      bestLen = dir.length;
      bestConceptId = dir;
    }
  }

  // Require a minimum match fraction to avoid spurious single-word hits on
  // very short concept slugs. 0.45 allows 1-of-2-meaningful-word matches
  // while rejecting generic single-word messages.
  if (bestScore < 0.45 || !bestConceptId) return null;

  return resolveAtom(bestConceptId, action);
}
