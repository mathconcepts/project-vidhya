/**
 * content-generation job — background atom generation in FILE mode
 * (content-pipeline realignment plan, Accepted Scope item 4).
 *
 * Wraps the EXISTING concept-orchestrator
 * (src/content/concept-orchestrator/orchestrator.ts). "FILE mode" means
 * accepted atoms persist as markdown files under
 * modules/project-vidhya-content/concepts/<concept_id>/atoms/ in the
 * exact format the atom-loader parses (YAML frontmatter with id,
 * concept_id, atom_type, bloom_level, difficulty, exam_ids + body).
 * The orchestrator's own DB persistence (atom_versions) still runs when
 * DATABASE_URL is set; without a DB it no-ops and the files are the
 * artifact — the demo stays DB-less honest.
 *
 * Iterates concepts from the concept graph that LACK atoms, honoring
 * CONTENT_MAX_LLM_CALLS_PER_RUN (estimated calls per concept; hitting
 * the budget pauses the job resumably) and GEMINI_BATCH_SIZE (breather
 * between batches), checkpointing after each concept.
 *
 * Without GEMINI_API_KEY the job REFUSES to start: generating
 * stub/placeholder atoms is banned by the realignment plan — the exact
 * regression that shipped 82 placeholder explainers.
 */

import fs from 'fs';
import path from 'path';
import {
  registerJob,
  QuotaExhaustedError,
  type JobContext,
  type JobDefinition,
} from './job-runner';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { generateConcept } from '../content/concept-orchestrator';
import type { GeneratedAtom } from '../content/concept-orchestrator';
import { reloadAtoms } from '../content/atom-loader';

export const CONTENT_GENERATION_JOB = 'content-generation';

/**
 * Estimated LLM calls per concept for budget accounting:
 * 11 atom generations + 2 consensus second-opinions (worked_example,
 * formal_definition) + 11 llm-judge scorings = 24. The orchestrator does
 * not expose per-call hooks, so the budget is enforced on this estimate;
 * the quota ledger records per-atom granularity.
 */
export const ESTIMATED_LLM_CALLS_PER_CONCEPT = 24;

/** Atoms shorter than this are treated as generation failures, never written. */
const MIN_ATOM_CONTENT_CHARS = 40;

/** Concepts root — override with VIDHYA_CONCEPTS_ROOT (tests). */
export function conceptsRoot(): string {
  return (
    process.env.VIDHYA_CONCEPTS_ROOT ||
    path.resolve(process.cwd(), 'modules/project-vidhya-content/concepts')
  );
}

/** Does this concept already have at least one atom file on disk? */
export function conceptHasAtoms(concept_id: string): boolean {
  try {
    const atomsDir = path.join(conceptsRoot(), concept_id, 'atoms');
    if (!fs.existsSync(atomsDir) || !fs.statSync(atomsDir).isDirectory()) return false;
    return fs.readdirSync(atomsDir).some((f) => f.endsWith('.md'));
  } catch {
    return false;
  }
}

/** Serialize one generated atom in the existing authored-atom file format. */
export function renderAtomFile(atom: GeneratedAtom): string {
  const examIds = JSON.stringify(atom.exam_ids && atom.exam_ids.length ? atom.exam_ids : ['*']);
  return [
    '---',
    `id: ${atom.atom_id}`,
    `concept_id: ${atom.concept_id}`,
    `atom_type: ${atom.atom_type}`,
    `bloom_level: ${atom.bloom_level}`,
    `difficulty: ${atom.difficulty}`,
    `exam_ids: ${examIds}`,
    `generated_by: concept-orchestrator`,
    `generated_at: ${atom.meta?.generated_at ?? new Date().toISOString()}`,
    '---',
    '',
    atom.content.trim(),
    '',
  ].join('\n');
}

function atomFileName(atom_type: string): string {
  return `${atom_type.replace(/_/g, '-')}.md`;
}

function atomicWriteFile(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

/** Minimal meta.yaml so a freshly generated concept dir is self-describing. */
function ensureMetaYaml(concept_id: string, label: string): void {
  const metaPath = path.join(conceptsRoot(), concept_id, 'meta.yaml');
  if (fs.existsSync(metaPath)) return;
  atomicWriteFile(
    metaPath,
    [
      `concept_id: ${concept_id}`,
      `title: ${label}`,
      `licence: MIT`,
      `contributor: concept-orchestrator (content-generation job)`,
      '',
    ].join('\n'),
  );
}

// Injectable sleeper for the inter-batch breather (tests).
let _sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH_BREATHER_MS = 500;

async function run(ctx: JobContext): Promise<void> {
  const missing = ALL_CONCEPTS.filter((c) => !conceptHasAtoms(c.id));
  ctx.log(`${missing.length}/${ALL_CONCEPTS.length} concepts lack atoms — generating`);

  let llmCallsUsed = 0;
  let processedThisRun = 0;
  const cap = ctx.limits.content_max_llm_calls_per_run;
  const batchSize = ctx.limits.gemini_batch_size;

  await ctx.processItems(
    missing.map((c) => ({ key: c.id, concept: c })),
    async ({ concept }) => {
      if (llmCallsUsed + ESTIMATED_LLM_CALLS_PER_CONCEPT > cap) {
        throw new QuotaExhaustedError(
          `CONTENT_MAX_LLM_CALLS_PER_RUN budget exhausted (~${llmCallsUsed}/${cap} estimated calls) — ` +
          `job paused with a resumable checkpoint; restart to continue from ${concept.id}`,
        );
      }

      // Breather between provider batches (GEMINI_BATCH_SIZE concepts).
      if (processedThisRun > 0 && processedThisRun % batchSize === 0) {
        await _sleep(BATCH_BREATHER_MS);
      }
      processedThisRun++;

      const draft = await generateConcept({
        concept_id: concept.id,
        topic_family: concept.topic,
        dry_run: false,
      });
      llmCallsUsed += ESTIMATED_LLM_CALLS_PER_CONCEPT;

      // Ledger: one line per atom attempt. Provider approximated from the
      // atom's source cascade (per-call hooks are a deferred orchestrator
      // change; the cost dashboard reads this ledger later).
      for (const atom of draft.atoms) {
        const provider = atom.meta?.source_cascade?.includes('llm-gemini') ? 'gemini' : 'claude';
        ctx.recordProviderCall(provider, true);
      }
      for (const atom of draft.rejected_atoms) {
        const provider = atom.meta?.source_cascade?.includes('llm-gemini') ? 'gemini' : 'claude';
        ctx.recordProviderCall(provider, false);
      }

      // FILE mode: persist only atoms with real content. Empty or
      // near-empty bodies are failures, never written — stub atoms are
      // banned by the realignment plan.
      const writable = draft.atoms.filter(
        (a) => a.content && a.content.trim().length >= MIN_ATOM_CONTENT_CHARS,
      );
      if (writable.length === 0) {
        throw new Error(
          `no usable atoms generated for ${concept.id} ` +
          `(${draft.atoms.length} accepted, ${draft.rejected_atoms.length} rejected) — nothing written`,
        );
      }

      ensureMetaYaml(concept.id, concept.label);
      const atomsDir = path.join(conceptsRoot(), concept.id, 'atoms');
      for (const atom of writable) {
        atomicWriteFile(path.join(atomsDir, atomFileName(atom.atom_type)), renderAtomFile(atom));
      }
      reloadAtoms(); // bust the atom-loader cache so lessons pick the new files up

      return {
        atoms_written: writable.length,
        atoms_rejected: draft.rejected_atoms.length,
        cost_usd: draft.total_cost_usd,
      };
    },
  );

  ctx.log(`run finished — ~${llmCallsUsed} estimated LLM calls used`);
}

export const contentGenerationJob: JobDefinition = {
  name: CONTENT_GENERATION_JOB,
  description:
    'Generate atoms (via the concept-orchestrator, FILE mode) for every concept-graph concept that lacks them; budgeted, batched, checkpointed per concept',
  preflight(): string | null {
    if (!process.env.GEMINI_API_KEY) {
      return (
        'GEMINI_API_KEY is not set — the content-generation job refuses to start. ' +
        'Generating stub/placeholder atoms is banned by the content-pipeline realignment plan; ' +
        'set GEMINI_API_KEY and retry.'
      );
    }
    return null;
  },
  run,
};

registerJob(contentGenerationJob);

export const __testing = {
  setSleepForTests(fn: (ms: number) => Promise<void>): () => void {
    const prev = _sleep;
    _sleep = fn;
    return () => { _sleep = prev; };
  },
};
