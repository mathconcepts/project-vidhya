/**
 * src/registry/pain-points.ts
 *
 * Loader and accessor for the Pain-Point Registry (Track E1).
 *
 * Registry files: data/registry/pain-points/<module>.yml
 * Schema validated at load time — malformed files throw RegistryValidationError.
 *
 * Only 'reviewed' modules are returned from getReviewedModule(). Draft modules
 * are loaded, counted on the coverage meter, but never returned for prompt use.
 * Callers MUST use getReviewedModule() — raw loading bypasses the guard.
 *
 * PainPointUnmappedError is a counter, not a throw — the generic path is
 * served when a concept has no registry entry.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type {
  PainPointModule,
  PainPointModuleFile,
  ConceptPainEntry,
  PainPoint,
  UserExpectation,
} from './types';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class RegistryValidationError extends Error {
  constructor(public readonly file: string, message: string) {
    super(`RegistryValidationError [${file}]: ${message}`);
    this.name = 'RegistryValidationError';
  }
}

export class RegistryUnreviewedError extends Error {
  constructor(public readonly module: string) {
    super(`RegistryUnreviewedError: module '${module}' is draft — cannot use for prompt steering`);
    this.name = 'RegistryUnreviewedError';
  }
}

// ---------------------------------------------------------------------------
// Module cache (singleton, loaded once per process)
// ---------------------------------------------------------------------------

const REGISTRY_DIR = path.resolve(process.cwd(), 'data/registry/pain-points');

let _cache: Map<string, PainPointModule> | null = null;
let _unmappedCounter = 0;

/** Counter for concepts with no reviewed registry entry. Surface on /admin/content-rd. */
export function getPainPointUnmappedCount(): number {
  return _unmappedCounter;
}

export function resetUnmappedCounter(): void {
  _unmappedCounter = 0;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function loadRegistry(): Map<string, PainPointModule> {
  const modules = new Map<string, PainPointModule>();

  if (!existsSync(REGISTRY_DIR)) return modules;

  const files = readdirSync(REGISTRY_DIR).filter((f) => f.endsWith('.yml'));
  const seenIds = new Set<string>();

  for (const file of files) {
    const filePath = path.join(REGISTRY_DIR, file);
    let raw: unknown;
    try {
      raw = yaml.load(readFileSync(filePath, 'utf-8'));
    } catch (e) {
      throw new RegistryValidationError(file, `YAML parse error: ${(e as Error).message}`);
    }

    const doc = raw as PainPointModuleFile;
    if (!doc || typeof doc !== 'object') {
      throw new RegistryValidationError(file, 'Root must be an object');
    }

    const moduleName = doc.module;
    if (typeof moduleName !== 'string' || !moduleName) {
      throw new RegistryValidationError(file, 'Missing required field: module');
    }

    const reviewStatus = doc.review_status;
    if (reviewStatus !== 'draft' && reviewStatus !== 'reviewed') {
      throw new RegistryValidationError(file, `Invalid review_status: '${reviewStatus}'`);
    }

    const concepts: Record<string, ConceptPainEntry> = {};
    const META_KEYS = new Set(['review_status', 'module', 'reviewed_by', 'reviewed_at', 'concepts']);

    // Support both flat top-level keys and a nested `concepts:` key
    const conceptEntries: Record<string, unknown> =
      (doc as unknown as Record<string, unknown>).concepts != null &&
      typeof (doc as unknown as Record<string, unknown>).concepts === 'object'
        ? ((doc as unknown as Record<string, unknown>).concepts as Record<string, unknown>)
        : Object.fromEntries(Object.entries(doc as unknown as Record<string, unknown>).filter(([k]) => !META_KEYS.has(k)));

    for (const [key, value] of Object.entries(conceptEntries)) {
      const entry = value as ConceptPainEntry;
      if (!entry || typeof entry !== 'object' || !Array.isArray(entry.pain_points)) {
        throw new RegistryValidationError(file, `Concept '${key}': missing pain_points array`);
      }

      // Validate ids and check for duplicates
      for (const pp of entry.pain_points as PainPoint[]) {
        if (!pp.id || !pp.id.startsWith('pp_')) {
          throw new RegistryValidationError(file, `Concept '${key}': pain_point id must start with pp_`);
        }
        if (seenIds.has(pp.id)) {
          throw new RegistryValidationError(file, `Duplicate id: '${pp.id}'`);
        }
        seenIds.add(pp.id);
      }

      for (const ue of (entry.user_expectations ?? []) as UserExpectation[]) {
        if (!ue.id || !ue.id.startsWith('ue_')) {
          throw new RegistryValidationError(file, `Concept '${key}': user_expectation id must start with ue_`);
        }
        if (seenIds.has(ue.id)) {
          throw new RegistryValidationError(file, `Duplicate id: '${ue.id}'`);
        }
        seenIds.add(ue.id);
      }

      concepts[key] = entry;
    }

    modules.set(moduleName, { module: moduleName, review_status: reviewStatus, concepts });
  }

  return modules;
}

function ensureLoaded(): Map<string, PainPointModule> {
  if (!_cache) {
    _cache = loadRegistry();
  }
  return _cache;
}

/** For tests only — clears the singleton cache. */
export function _resetCacheForTests(): void {
  _cache = null;
  _unmappedCounter = 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the reviewed module for the given module name, or null if:
 *   - the module doesn't exist (PainPointUnmappedError counter incremented)
 *   - the module is still draft (RegistryUnreviewedError logged, not thrown)
 *
 * Callers MUST use this — never access the raw cache.
 */
export function getReviewedModule(moduleName: string): PainPointModule | null {
  const registry = ensureLoaded();
  const mod = registry.get(moduleName);

  if (!mod) {
    _unmappedCounter++;
    return null;
  }

  if (mod.review_status === 'draft') {
    // Log loudly but don't throw — fall back to generic path
    console.warn(`[registry] RegistryUnreviewedError: module '${moduleName}' is draft — using generic prompt`);
    return null;
  }

  return mod;
}

/**
 * Returns the ConceptPainEntry for a given concept within a reviewed module.
 * Returns null (and increments unmapped counter) when not found.
 */
export function getPainEntry(moduleName: string, conceptId: string): ConceptPainEntry | null {
  const mod = getReviewedModule(moduleName);
  if (!mod) return null;

  const entry = mod.concepts[conceptId];
  if (!entry) {
    _unmappedCounter++;
    return null;
  }

  return entry;
}

/**
 * Returns the top-severity pain points for a concept (high first, then med, then low).
 * Returns empty array when the concept has no reviewed registry entry.
 */
export function getTopPainPoints(moduleName: string, conceptId: string, limit = 3): PainPoint[] {
  const entry = getPainEntry(moduleName, conceptId);
  if (!entry) return [];

  const SEVERITY_ORDER: Record<string, number> = { high: 0, med: 1, low: 2 };
  return [...entry.pain_points]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
    .slice(0, limit);
}

/**
 * Returns all user expectations with a given artifact_hint across a module.
 * Used by the modality orchestrator and E7 delight bundle generators.
 */
export function getExpectationsByHint(
  moduleName: string,
  hint: string,
): UserExpectation[] {
  const mod = getReviewedModule(moduleName);
  if (!mod) return [];

  const results: UserExpectation[] = [];
  for (const entry of Object.values(mod.concepts)) {
    for (const ue of entry.user_expectations ?? []) {
      if (ue.artifact_hint === hint) results.push(ue);
    }
  }
  return results;
}

/**
 * Coverage summary for the /admin/content-rd coverage meter.
 */
export interface RegistryCoverage {
  total_modules: number;
  reviewed_modules: number;
  draft_modules: number;
  total_concepts: number;
  unmapped_requests: number;
  modules: Array<{ name: string; status: string; concept_count: number }>;
}

export function getRegistryCoverage(): RegistryCoverage {
  const registry = ensureLoaded();
  const modules = [...registry.values()];

  return {
    total_modules: modules.length,
    reviewed_modules: modules.filter((m) => m.review_status === 'reviewed').length,
    draft_modules: modules.filter((m) => m.review_status === 'draft').length,
    total_concepts: modules.reduce((sum, m) => sum + Object.keys(m.concepts).length, 0),
    unmapped_requests: _unmappedCounter,
    modules: modules.map((m) => ({
      name: m.module,
      status: m.review_status,
      concept_count: Object.keys(m.concepts).length,
    })),
  };
}

/**
 * Builds the pain-point steering block for the LLM prompt assembler.
 * Returns empty string when no reviewed entry exists (generic path).
 *
 * The prompt MUST address the top-severity pp_* entries — this text is
 * injected into buildPrompt() in orchestrator.ts.
 */
export function buildPainPointPromptBlock(moduleName: string, conceptId: string): string {
  const topPains = getTopPainPoints(moduleName, conceptId);
  const entry = getPainEntry(moduleName, conceptId);

  if (!topPains.length) return '';

  const painLines = topPains
    .map((pp, i) => `  ${i + 1}. [${pp.severity.toUpperCase()}] ${pp.statement} (${pp.id})`)
    .join('\n');

  const ueLines = (entry?.user_expectations ?? [])
    .map((ue) => `  • ${ue.statement} (${ue.id})`)
    .join('\n');

  const competitorNote = (entry?.competitor_benchmark ?? []).length
    ? `\nCompetitor benchmark: ${entry!.competitor_benchmark!.join('; ')} — match or exceed this standard.`
    : '';

  return `
STUDENT PAIN POINTS FOR THIS CONCEPT (address ALL of these, highest-severity first):
${painLines}

STUDENT EXPECTATIONS (your atom should satisfy these):
${ueLines || '  (none specified)'}
${competitorNote}

Your atom MUST explicitly name and resolve the top-severity pain point above.
Generic coverage of the topic is not acceptable when a specific student struggle is documented.
`.trim();
}
