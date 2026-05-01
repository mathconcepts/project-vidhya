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

// ─── Concept-orchestrator v1 enrichment helpers ─────────────────────
//
// These functions enrich atoms with per-student state read from the DB.
// Kept OUT of loadConceptAtoms() so the file cache stays student-agnostic.
// Callers (lesson-routes) explicitly invoke them after loading the
// canonical atoms.

import pg from 'pg';

let _enrichmentPool: any = null;
function getEnrichmentPool() {
  if (_enrichmentPool) return _enrichmentPool;
  if (!process.env.DATABASE_URL) return null;
  const { Pool } = pg;
  _enrichmentPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _enrichmentPool;
}

/**
 * Apply student-specific atom_overrides to a list of atoms. For each
 * atom whose (student_id, atom_id) pair has an active (non-expired)
 * override, the canonical content is replaced with the override.
 * Marks atom.is_student_override = true for downstream observability.
 *
 * Single SELECT per call (no N+1). Graceful no-op without DB.
 * Returns the atoms list with content swapped in-place.
 */
// @ts-ignore — gray-matter typing varies
export async function applyStudentOverrides(
  atoms: ContentAtom[],
  student_id: string | null,
): Promise<ContentAtom[]> {
  if (!student_id || atoms.length === 0) return atoms;
  const pool = getEnrichmentPool();
  if (!pool) return atoms;

  try {
    const ids = atoms.map((a) => a.id);
    const r = await pool.query(
      `SELECT atom_id, override_content
         FROM student_atom_overrides
         WHERE student_id = $1 AND atom_id = ANY($2) AND expires_at > NOW()`,
      [student_id, ids],
    );
    const byId: Map<string, string> = new Map();
    for (const row of r.rows) byId.set(row.atom_id, row.override_content);
    for (const atom of atoms) {
      const ov = byId.get(atom.id);
      if (ov) {
        atom.content = ov;
        atom.is_student_override = true;
      }
    }
  } catch (err) {
    console.warn(`[atom-loader] applyStudentOverrides failed: ${(err as Error).message}`);
  }
  return atoms;
}

/**
 * Populate atom.improved_since + atom.improvement_reason from the active
 * atom_versions row. The frontend MarkdownAtomRenderer compares this
 * timestamp against the student's last_seen_at for the atom and shows
 * an emerald "Improved" pill when newer.
 *
 * Single SELECT per call. No-op when DB unavailable or no versions exist.
 */
// @ts-ignore
export async function applyImprovedSince(atoms: ContentAtom[]): Promise<ContentAtom[]> {
  if (atoms.length === 0) return atoms;
  const pool = getEnrichmentPool();
  if (!pool) return atoms;

  try {
    const ids = atoms.map((a) => a.id);
    const r = await pool.query(
      `SELECT atom_id, generated_at, improvement_reason
         FROM atom_versions
         WHERE atom_id = ANY($1) AND active = TRUE`,
      [ids],
    );
    const byId: Map<string, { generated_at: string; reason: string | null }> = new Map();
    for (const row of r.rows) {
      byId.set(row.atom_id, {
        generated_at: row.generated_at,
        reason: row.improvement_reason,
      });
    }
    for (const atom of atoms) {
      const v = byId.get(atom.id);
      if (v) {
        atom.improved_since = typeof v.generated_at === 'string'
          ? v.generated_at
          : new Date(v.generated_at).toISOString();
        atom.improvement_reason = v.reason;
      }
    }
  } catch (err) {
    console.warn(`[atom-loader] applyImprovedSince failed: ${(err as Error).message}`);
  }
  return atoms;
}

/**
 * Apply A/B test variant assignments (PENDING.md §4.12). For each atom
 * with a running experiment, hash-buckets the student into control or
 * candidate and swaps the served content to that version. Sets
 * `is_ab_variant` for downstream observability.
 *
 * No-op when:
 *   - student_id is null (anonymous traffic skips A/B — bucket assignment
 *     requires a stable identifier; using session_id breaks consistency
 *     across a student's multiple sessions)
 *   - DB unavailable
 *   - VIDHYA_AB_TESTING is not 'on' (experiments still ALLOWED in the DB,
 *     but the loader serves the active version and ignores them)
 *
 * Single SELECT against atom_ab_tests for the requested atom_ids, then
 * one bulk SELECT against atom_versions for the assigned version contents.
 * No N+1.
 */
// @ts-ignore
export async function applyAbVariants(
  atoms: ContentAtom[],
  student_id: string | null,
): Promise<ContentAtom[]> {
  if (!student_id || atoms.length === 0) return atoms;
  if (process.env.VIDHYA_AB_TESTING !== 'on') return atoms;
  const pool = getEnrichmentPool();
  if (!pool) return atoms;

  try {
    const ids = atoms.map((a) => a.id);
    const r = await pool.query(
      `SELECT atom_id, control_version_n, candidate_version_n
         FROM atom_ab_tests
         WHERE atom_id = ANY($1) AND status = 'running' AND ends_at > NOW()`,
      [ids],
    );
    if (r.rows.length === 0) return atoms;

    // Inline FNV-1a so atom-loader doesn't import the orchestrator (keeps
    // the dep graph clean — orchestrator imports atom-loader, not the other
    // way around).
    function fnv1a(input: string): number {
      let hash = 0x811c9dc5;
      for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      return hash >>> 0;
    }
    function bucketFor(atom_id: string, sid: string): 'control' | 'candidate' {
      return fnv1a(`${atom_id}::${sid}`) % 2 === 0 ? 'control' : 'candidate';
    }

    // Map atom_id → assigned version_n.
    const assignedVersion: Map<string, number> = new Map();
    for (const row of r.rows) {
      const bucket = bucketFor(row.atom_id, student_id);
      const v = bucket === 'control' ? row.control_version_n : row.candidate_version_n;
      assignedVersion.set(row.atom_id, v);
    }

    // Bulk-fetch the assigned (atom_id, version_n) contents.
    const pairs = Array.from(assignedVersion.entries()).map(([k, v]) => ({ atom_id: k, version_n: v }));
    if (pairs.length === 0) return atoms;
    const atomIds = pairs.map((p) => p.atom_id);
    const versionNs = pairs.map((p) => p.version_n);
    const r2 = await pool.query(
      `SELECT atom_id, version_n, content
         FROM atom_versions
         WHERE (atom_id, version_n) IN (
           SELECT * FROM unnest($1::text[], $2::int[])
         )`,
      [atomIds, versionNs],
    );
    const contentByPair: Map<string, string> = new Map();
    for (const row of r2.rows) {
      contentByPair.set(`${row.atom_id}::${row.version_n}`, row.content);
    }

    for (const atom of atoms) {
      const v = assignedVersion.get(atom.id);
      if (v == null) continue;
      const content = contentByPair.get(`${atom.id}::${v}`);
      if (content) {
        atom.content = content;
        (atom as any).is_ab_variant = true;
        (atom as any).ab_version_n = v;
      }
    }
  } catch (err) {
    console.warn(`[atom-loader] applyAbVariants failed: ${(err as Error).message}`);
  }
  return atoms;
}
