/**
 * src/generation/batch/jsonl-builder.ts
 *
 * Deterministic JSONL builder. Same atom_specs → same bytes, byte-for-byte.
 * That property is the cornerstone of resume-after-crash: if our on-disk
 * JSONL is missing on boot, we rebuild it from the durable batch_jobs
 * table and re-upload — and the provider de-dupes by display_name.
 *
 * Determinism rules:
 *   1. Sub-jobs are sorted by custom_id (lexicographic) — never input order.
 *   2. Object keys serialised in canonical order (alphabetical).
 *   3. No timestamps, no random ids, no env-dependent values inside the
 *      JSONL bytes. Caller supplies custom_id; builder doesn't generate.
 *   4. Trailing newline after every row; exactly one empty line at end.
 */

import { createHash } from 'crypto';
import type { BatchJob, AtomSpec, BatchProvider } from './types';

/**
 * Deterministic id for an atom_spec inside a run. Same (run_id, spec) → same id.
 * Reused as the provider's `custom_id` so we can re-attach results on resume.
 *
 * Format: 'job-' + 12 hex chars (48 bits → ~2.8e14, plenty for any single run).
 */
export function customIdFor(run_id: string, spec: AtomSpec): string {
  const canonical = stableStringify(spec);
  const hex = createHash('sha256').update(`${run_id}::${canonical}`).digest('hex');
  return `job-${hex.slice(0, 12)}`;
}

/**
 * Build a list of BatchJobs from a list of atom_specs. The output is
 * sorted + deduped by custom_id.
 */
export function buildJobs(run_id: string, specs: AtomSpec[]): BatchJob[] {
  const seen = new Set<string>();
  const jobs: BatchJob[] = [];
  for (const spec of specs) {
    const custom_id = customIdFor(run_id, spec);
    if (seen.has(custom_id)) continue;   // duplicate spec → one job
    seen.add(custom_id);
    jobs.push({ custom_id, atom_spec: spec });
  }
  jobs.sort((a, b) => (a.custom_id < b.custom_id ? -1 : a.custom_id > b.custom_id ? 1 : 0));
  return jobs;
}

/**
 * Build the JSONL bytes for a given provider. Every adapter wraps each
 * job in its own request envelope; this dispatch keeps the builder
 * provider-aware without leaking provider-specific code into the
 * orchestrator.
 */
export function buildJsonl(provider: BatchProvider, jobs: BatchJob[]): string {
  const lines: string[] = [];
  for (const job of jobs) {
    lines.push(buildRow(provider, job));
  }
  return lines.join('\n') + '\n';
}

function buildRow(provider: BatchProvider, job: BatchJob): string {
  switch (provider) {
    case 'gemini':
      return stableStringify({
        custom_id: job.custom_id,
        request: {
          contents: [
            { role: 'user', parts: [{ text: renderPrompt(job.atom_spec) }] },
          ],
          // Deterministic generation params; temperature 0 for repeatability.
          generation_config: {
            temperature: 0,
            top_p: 1,
            max_output_tokens: 2048,
            response_mime_type: 'application/json',
          },
        },
      });
    case 'openai':
      return stableStringify({
        custom_id: job.custom_id,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-4o-mini',  // adapter overrides via env
          temperature: 0,
          messages: [{ role: 'user', content: renderPrompt(job.atom_spec) }],
          response_format: { type: 'json_object' },
        },
      });
    case 'anthropic':
      return stableStringify({
        custom_id: job.custom_id,
        params: {
          model: 'claude-haiku-4-5',
          max_tokens: 2048,
          messages: [{ role: 'user', content: renderPrompt(job.atom_spec) }],
        },
      });
  }
}

/**
 * Render the prompt text for one atom_spec. Pure deterministic function
 * over the spec — no clocks, no env. The prompt template is referenced
 * by id so the body can evolve without breaking determinism for a given
 * `prompt_template_id` value (operator picks a NEW template id when they
 * change semantics).
 *
 * v1 keeps this minimal — production prompt-template resolution is left
 * to the orchestrator, which can pass a fully-rendered prompt as
 * `atom_spec.prompt_vars.rendered_prompt` if it wants control.
 */
export function renderPrompt(spec: AtomSpec): string {
  if (typeof spec.prompt_vars.rendered_prompt === 'string') {
    return spec.prompt_vars.rendered_prompt;
  }
  const lines: string[] = [];
  lines.push(`Generate one ${spec.atom_type} atom for concept "${spec.concept_id}" at difficulty=${spec.difficulty}.`);
  lines.push(`Prompt template: ${spec.prompt_template_id}`);
  if (spec.hints && spec.hints.length > 0) {
    lines.push('Hints:');
    for (const h of spec.hints) lines.push(`- ${h}`);
  }
  // Sort prompt_vars keys for byte-determinism.
  const keys = Object.keys(spec.prompt_vars).sort();
  if (keys.length > 0) {
    lines.push('Vars:');
    for (const k of keys) lines.push(`- ${k}: ${String(spec.prompt_vars[k])}`);
  }
  lines.push('Respond with a single JSON object describing the atom.');
  return lines.join('\n');
}

// ----------------------------------------------------------------------------
// Canonical JSON: stable key order, no whitespace.
// ----------------------------------------------------------------------------

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
