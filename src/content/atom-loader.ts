/**
 * atom-loader — loads ContentAtom v2 files from disk with caching + dev hot-reload.
 *
 * Folder layout per concept:
 *   modules/project-vidhya-content/concepts/{concept_id}/
 *     meta.yaml          — ConceptMeta (title, exams, learning_objectives, exam_overlays, ...)
 *     atoms/*.md         — ContentAtom files with YAML frontmatter
 *     explainer.md       — legacy fallback (used when atoms/ is absent)
 *
 * Fallback chain (PedagogyEngine relies on this):
 *   atoms/ present                      → return parsed ContentAtom[]
 *   atoms/ absent, explainer.md present → return [singleAtom] of type formal_definition
 *   neither present                     → throw ConceptNotFoundError (callers map to 404)
 *
 * Cache mirrors src/content/resolver.ts:111 — populated on first read,
 * invalidated via reloadAtoms(). In dev, fs.watch on the concepts dir
 * auto-clears the cache (debounced 500ms) so authors get hot-reload.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import type { ContentAtom, AtomType } from './content-types';
import type { ConceptMeta } from '../curriculum/types';

export class ConceptNotFoundError extends Error {
  constructor(public concept_id: string) {
    super(`concept_not_found: ${concept_id}`);
    this.name = 'ConceptNotFoundError';
  }
}

// ─── Resolve concepts root once ─────────────────────────────────────────

const CONCEPTS_ROOT = path.resolve(
  process.cwd(),
  'modules/project-vidhya-content/concepts',
);

function conceptDir(concept_id: string): string {
  return path.join(CONCEPTS_ROOT, concept_id);
}

// ─── Cache ──────────────────────────────────────────────────────────────

let _atomCache: Map<string, ContentAtom[]> | null = null;
let _metaCache: Map<string, ConceptMeta> | null = null;

function ensureCaches(): void {
  if (!_atomCache) _atomCache = new Map();
  if (!_metaCache) _metaCache = new Map();
}

/** Explicit cache clear — call after authoring changes in production. */
export function reloadAtoms(): void {
  _atomCache = null;
  _metaCache = null;
}

// ─── Dev fs.watch (hot reload for authors) ──────────────────────────────

let _watcherStarted = false;
function startDevWatcher(): void {
  if (_watcherStarted) return;
  if (process.env.NODE_ENV !== 'development') return;
  if (!fs.existsSync(CONCEPTS_ROOT)) return;
  _watcherStarted = true;

  let timer: NodeJS.Timeout | null = null;
  try {
    fs.watch(CONCEPTS_ROOT, { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => reloadAtoms(), 500);
    });
  } catch {
    // recursive watch is unsupported on some Linux kernels; ignore silently
  }
}

// ─── Loaders ────────────────────────────────────────────────────────────

/**
 * Load all atoms for a concept.
 *
 * Fallback chain:
 *   1. atoms/*.md present → parse each; return array
 *   2. atoms/ absent + explainer.md present → return single formal_definition atom
 *   3. neither → throw ConceptNotFoundError
 *
 * Frontmatter parse errors on a single atom log a warning and skip that atom;
 * sibling atoms still load.
 */
export async function loadConceptAtoms(concept_id: string): Promise<ContentAtom[]> {
  ensureCaches();
  startDevWatcher();

  const cached = _atomCache!.get(concept_id);
  if (cached) return cached;

  const dir = conceptDir(concept_id);
  const atomsDir = path.join(dir, 'atoms');
  const explainerPath = path.join(dir, 'explainer.md');

  let atoms: ContentAtom[] = [];

  if (fs.existsSync(atomsDir) && fs.statSync(atomsDir).isDirectory()) {
    const files = fs.readdirSync(atomsDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const full = path.join(atomsDir, file);
      try {
        const raw = fs.readFileSync(full, 'utf-8');
        const parsed = matter(raw);
        const fm = parsed.data as Partial<ContentAtom>;
        if (!fm.id || !fm.atom_type || fm.bloom_level == null || fm.difficulty == null) {
          console.warn(`[atom-loader] ${full}: missing required frontmatter; skipping`);
          continue;
        }
        atoms.push({
          id: fm.id,
          concept_id: fm.concept_id ?? concept_id,
          atom_type: fm.atom_type as AtomType,
          bloom_level: fm.bloom_level as ContentAtom['bloom_level'],
          difficulty: fm.difficulty as number,
          exam_ids: (fm.exam_ids as string[]) ?? ['*'],
          content: parsed.content.trim(),
          scaffold_fade: fm.scaffold_fade,
          animation_preset: fm.animation_preset,
          modality: fm.modality,
          tested_by_atom: fm.tested_by_atom,
          retention_tags: fm.retention_tags,
          estimated_minutes: fm.estimated_minutes,
          depth_weight: fm.depth_weight,
        });
      } catch (err) {
        console.warn(`[atom-loader] ${full}: parse error ${(err as Error).message}; skipping`);
      }
    }
    _atomCache!.set(concept_id, atoms);
    return atoms;
  }

  if (fs.existsSync(explainerPath)) {
    const raw = fs.readFileSync(explainerPath, 'utf-8');
    const parsed = matter(raw);
    const fallbackAtom: ContentAtom = {
      id: `${concept_id}.legacy.explainer`,
      concept_id,
      atom_type: 'formal_definition',
      bloom_level: 2,
      difficulty: 0.0,
      exam_ids: ['*'],
      content: parsed.content.trim() || raw.trim(),
    };
    atoms = [fallbackAtom];
    _atomCache!.set(concept_id, atoms);
    return atoms;
  }

  throw new ConceptNotFoundError(concept_id);
}

/**
 * Load `meta.yaml` for a concept. Returns defaults (just `concept_id`) if
 * the file is absent — additive schema means missing optional fields are fine.
 */
export async function loadConceptMeta(concept_id: string): Promise<ConceptMeta> {
  ensureCaches();
  startDevWatcher();

  const cached = _metaCache!.get(concept_id);
  if (cached) return cached;

  const dir = conceptDir(concept_id);
  const metaPath = path.join(dir, 'meta.yaml');
  let meta: ConceptMeta = { concept_id };

  if (fs.existsSync(metaPath)) {
    try {
      const raw = fs.readFileSync(metaPath, 'utf-8');
      const data = yaml.load(raw) as Partial<ConceptMeta> | null;
      if (data && typeof data === 'object') {
        meta = { ...data, concept_id: data.concept_id ?? concept_id };
      }
    } catch (err) {
      console.warn(`[atom-loader] ${metaPath}: yaml parse error ${(err as Error).message}; using defaults`);
    }
  }

  _metaCache!.set(concept_id, meta);
  return meta;
}
