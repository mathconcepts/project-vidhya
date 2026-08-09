/**
 * src/registry/pedagogy-patterns.ts
 *
 * Pedagogy Pattern Library loader (Track E4).
 *
 * Reads: data/registry/pedagogy-patterns.yml
 * Returns: PedagogyPattern[] for generation-prompt injection and blueprint
 *          template-engine stage selection.
 *
 * Surveillance: no per-student data — patterns are aggregate knowledge,
 * not derived from individual student behavior.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import type { PedagogyPattern, PedagogyPatternRegistry, PatternStatus } from './types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY_PATH = path.join(ROOT, 'data/registry/pedagogy-patterns.yml');

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class PatternLifecycleError extends Error {
  constructor(
    public readonly pattern_id: string,
    public readonly reason: string,
  ) {
    super(`[pedagogy-patterns] ${pattern_id}: ${reason}`);
    this.name = 'PatternLifecycleError';
  }
}

// ---------------------------------------------------------------------------
// Loader (singleton-cached per process)
// ---------------------------------------------------------------------------

let _patterns: PedagogyPattern[] | null = null;

function loadPatterns(): PedagogyPattern[] {
  if (_patterns !== null) return _patterns;

  if (!fs.existsSync(REGISTRY_PATH)) {
    console.warn('[pedagogy-patterns] registry file not found — returning empty set');
    _patterns = [];
    return _patterns;
  }

  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    const doc = yaml.load(raw) as PedagogyPatternRegistry;

    if (!doc || typeof doc !== 'object') {
      console.warn('[pedagogy-patterns] empty or invalid registry — returning empty set');
      _patterns = [];
      return _patterns;
    }

    if (!Array.isArray(doc.patterns)) {
      console.warn('[pedagogy-patterns] no patterns array in registry — returning empty set');
      _patterns = [];
      return _patterns;
    }

    // Validate ids are ped_*-prefixed
    for (const p of doc.patterns) {
      if (typeof p.id !== 'string' || !p.id.startsWith('ped_')) {
        throw new PatternLifecycleError(p.id ?? '(unknown)', 'pattern id must start with ped_');
      }
      if (!Array.isArray(p.prompt_directives) || p.prompt_directives.length === 0) {
        throw new PatternLifecycleError(p.id, 'prompt_directives must be a non-empty array');
      }
    }

    _patterns = doc.patterns as PedagogyPattern[];
    return _patterns;
  } catch (err) {
    if (err instanceof PatternLifecycleError) throw err;
    throw new PatternLifecycleError('(parse)', String(err));
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All patterns regardless of status. */
export function getAllPatterns(): PedagogyPattern[] {
  return loadPatterns();
}

/** Only patterns with status='active'. */
export function getActivePatterns(): PedagogyPattern[] {
  return loadPatterns().filter((p) => p.status === 'active');
}

/** Patterns applicable to a given module and status. */
export function getPatternsForModule(
  moduleId: string,
  status: PatternStatus = 'active',
): PedagogyPattern[] {
  return loadPatterns().filter(
    (p) => p.status === status && p.applicable_modules.includes(moduleId),
  );
}

/** Look up a single pattern by id. */
export function getPattern(id: string): PedagogyPattern | null {
  return loadPatterns().find((p) => p.id === id) ?? null;
}

/**
 * Build an LLM prompt block for the applicable patterns on a module/concept.
 * Returns empty string when no active patterns apply (caller skips the block).
 *
 * Only injects patterns whose applicable_modules includes the module.
 */
export function buildPatternPromptBlock(
  moduleId: string,
  patternIds?: string[],
): string {
  const patterns = patternIds
    ? patternIds
        .map((id) => getPattern(id))
        .filter((p): p is PedagogyPattern => p !== null && p.status === 'active')
    : getPatternsForModule(moduleId, 'active');

  if (patterns.length === 0) return '';

  const lines: string[] = [
    '=== PEDAGOGY PATTERNS (apply all directives below) ===',
  ];
  for (const p of patterns) {
    lines.push(`\n[${p.id}] ${p.name}`);
    for (const directive of p.prompt_directives) {
      lines.push(`  • ${directive}`);
    }
  }
  lines.push('=== END PEDAGOGY PATTERNS ===');
  return lines.join('\n');
}
