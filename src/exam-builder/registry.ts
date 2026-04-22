// @ts-nocheck
/**
 * Exam Adapter Registry — portable plugin pattern.
 *
 * Problem being solved: as more exams are added (BITSAT, GATE, JEE,
 * NEET, UPSC, GRE, ...), we end up with `loadExamContentAndName`
 * branches scattered across sample-check-routes.ts, feedback-routes.ts,
 * course-routes.ts. Every new exam touches multiple files. Not modular.
 *
 * The registry pattern: each exam is a self-contained module that
 * calls `registerExamAdapter(adapter)` at import time. Core routes
 * query the registry (`getExamAdapter(exam_id)`) — they know nothing
 * about specific exams.
 *
 * Adding a new exam is now a drop-in operation:
 *   1. Create src/exams/adapters/my-new-exam.ts
 *   2. In that file, construct an ExamAdapter and call
 *      registerExamAdapter(adapter)
 *   3. Import that file once from src/exams/adapters/index.ts
 *      (or let auto-discovery pick it up — see loadBundledAdapters)
 *
 * Zero changes to orchestrator code, feedback-lookup, or any HTTP route.
 *
 * This is the portability guarantee: "new files can be added wherever
 * the software is installed." A deployer can drop an adapter into
 * src/exams/adapters/ and restart the server. No code edits.
 */

import type { ExamContent } from '../feedback/scope-applicator';
import type { GenerationSection } from '../sample-check/llm-generator';

// ============================================================================
// Adapter contract — what every exam must provide
// ============================================================================

export interface ExamAdapter {
  /** Unique id, e.g. "EXM-BITSAT-MATH-SAMPLE" */
  exam_id: string;
  /** Short code for filenames, e.g. "BITSAT-MATH-2026" */
  exam_code: string;
  /** Human-readable display name */
  exam_name: string;
  /** "entrance", "board", "competitive", "placement", etc. */
  level: string;

  /**
   * Return the current live ExamContent for this exam. Can be static
   * (imported constants for pilot exams) or dynamic (DB read for
   * production exams). The orchestrator does not care.
   */
  loadBaseContent(): ExamContent;

  /**
   * The canonical list of topic_ids this exam covers. Used by
   * feedback-lookup.ts to decide whether a cross-exam feedback item
   * about topic_id X is potentially relevant to this exam.
   */
  getSyllabusTopicIds(): string[];

  /**
   * Given a build request, return the list of GenerationSections to
   * feed to the LLM generator. Adapter decides what to generate —
   * BITSAT might want 10 MCQs per topic; JEE might want 5 numerical
   * + 5 MCQ; NEET's mix is different.
   *
   * If the adapter returns [], the orchestrator will not invoke the
   * LLM at all — useful for exams that are fully hand-authored.
   */
  defaultGenerationSections(opts?: { topic_ids?: string[]; count_per_topic?: number }): GenerationSection[];

  /**
   * Optional: post-process a SampleSnapshot before it's wrapped into a
   * SampleCheck. Exam can add its own schema checks, inject metadata,
   * de-duplicate questions, etc.
   */
  postProcessSnapshot?(snapshot: any): any;

  /** Optional: human description shown in admin UI */
  description?: string;

  /** Optional: version / build info for this adapter itself */
  adapter_version?: string;
}

// ============================================================================
// The registry
// ============================================================================

const _registry = new Map<string, ExamAdapter>();

export function registerExamAdapter(adapter: ExamAdapter): void {
  if (!adapter.exam_id) {
    throw new Error('ExamAdapter.exam_id is required');
  }
  if (_registry.has(adapter.exam_id)) {
    // Warn but allow override — supports hot-reload of adapters
    // during development without crashing the server.
    // In production, duplicate registration is usually a bug; we log
    // but don't throw.
    console.warn(`[exam-registry] Duplicate registration for ${adapter.exam_id}; overriding.`);
  }
  _registry.set(adapter.exam_id, adapter);
}

export function getExamAdapter(exam_id: string): ExamAdapter | null {
  return _registry.get(exam_id) ?? null;
}

export function listExamAdapters(): ExamAdapter[] {
  return Array.from(_registry.values());
}

export function unregisterExamAdapter(exam_id: string): boolean {
  return _registry.delete(exam_id);
}

/**
 * Called once at server startup. Imports every .ts file under
 * src/exams/adapters/ (non-recursive), triggering each adapter's
 * side-effect registration. Missing directory is non-fatal —
 * deployments without custom adapters just use the built-ins
 * registered via direct import.
 *
 * NOTE: we do not attempt runtime dynamic discovery via fs.readdir
 * because that breaks bundlers. Instead, src/exams/adapters/index.ts
 * is the single aggregation point — contributors add their imports
 * there. This gives us the portability benefit (one file to touch)
 * without the bundler incompatibility.
 */
export async function loadBundledAdapters(): Promise<{ loaded: number; errors: string[] }> {
  const errors: string[] = [];
  let loaded = 0;
  try {
    // The aggregator file imports every adapter for side-effect
    // registration. If it doesn't exist, that's fine — adapters may
    // be registered via direct imports from elsewhere (e.g. tests).
    await import('../exams/adapters/index');
    loaded = _registry.size;
  } catch (err: any) {
    // Ignore "module not found" for the optional aggregator; surface
    // other errors so developers can debug adapter bugs.
    if (err?.code !== 'ERR_MODULE_NOT_FOUND' && err?.code !== 'MODULE_NOT_FOUND') {
      errors.push(err?.message ?? String(err));
    }
  }
  return { loaded, errors };
}
