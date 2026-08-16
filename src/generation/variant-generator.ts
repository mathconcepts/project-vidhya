/**
 * The stance variant generator.
 *
 * ── It writes files, not rows ───────────────────────────────────────────
 *
 * `foldStanceVariants` runs inside the atom loader on disk-parsed markdown,
 * and no migration defines `variant_of` or `for_stance`, so a variant written
 * to `atom_versions` has nowhere to live and nothing to serve it. Files also
 * work on a DB-less deploy, which is where the demo runs and where stance
 * variants are the only personalisation that survives.
 *
 * ── It applies the gate's own rules before writing ──────────────────────
 *
 * `validateGenerated` calls the same `checkPair` the CI gate calls. A
 * generator that does not enforce what the gate enforces just produces files
 * that fail CI, which is a slower and more expensive way to learn the same
 * thing. A generation that violates a rule never reaches the content tree.
 *
 * ── Failure is closed ───────────────────────────────────────────────────
 *
 * Nothing lands unless the judge affirmatively passed it AND the structural
 * rules hold. A refused or unjudged draft goes to `.data/variant-drafts/` with
 * its reason, so the work is not lost and cannot be mistaken for approved. The
 * student then reads the base atom, which is an already-tested path — absence
 * degrades to the base body, never to an error and never to a blank.
 *
 * ── Everything external is injected ─────────────────────────────────────
 *
 * The model, the judge and the filesystem all arrive as dependencies, so every
 * decision in here is testable without an API key or a disk write. That is not
 * only hygiene: no LLM provider is configured in the environment this was
 * built in, so untestable logic would have shipped entirely unverified.
 */

import path from 'node:path';
import { checkPair, parseAtom, type Violation } from '../content/variant-agreement';
import { countProseWords } from '../content/prose-budget';
import { buildStanceInstruction, type CadenceStance } from '../content/stance-cadence';

export type { CadenceStance };

/** Where refused or unjudged drafts go. Never inside the content tree. */
export const DRAFT_DIR = '.data/variant-drafts';

export interface VariantRequest {
  conceptId: string;
  /** Atom type in underscore form, e.g. `worked_example`. */
  atomType: string;
  stance: CadenceStance;
  /** Full text of the base atom file, frontmatter included. */
  baseRaw: string;
  /** The topic's own `stances:` guidance for this atom type, if any. */
  topicGuidance?: string;
}

export interface JudgeVerdict {
  agrees: boolean;
  /** Why not, when it does not agree. Recorded with the draft. */
  reason?: string;
}

export interface GeneratorDeps {
  /** Returns the rewritten BODY only — no frontmatter. */
  generate(prompt: string): Promise<string>;
  /**
   * Does the variant assert anything the base contradicts, or drop a
   * condition the base establishes? Omission matters as much as
   * contradiction: the budget forces compression, so a dropped "assuming A is
   * invertible" is the expected failure and it contradicts nothing.
   */
  judge(input: { baseBody: string; variantBody: string; atomType: string }): Promise<JudgeVerdict>;
  writeFile(relPath: string, contents: string): Promise<void>;
}

export type GenerateOutcome =
  | { status: 'written'; path: string; proseWords: number }
  | { status: 'refused'; draftPath: string; reason: string; violations?: Violation[] };

/**
 * The variant's own id.
 *
 * Derived from `concept_id` and `atom_type`, deliberately NOT inherited from
 * the base atom's id. A handful of base atoms carry legacy hyphenated ids that
 * the integrity gate tolerates only as existing drift; inheriting one spreads
 * the drift into every new file instead of stopping at it. `variant_of`
 * carries the link and does not have to match.
 *
 * Dots in an id are hyphens in the filename, which is why the atom type is
 * hyphenated here: `orthogonality.worked-example.shaken` lives in
 * `worked-example-shaken.md`.
 */
export function variantIdFor(conceptId: string, atomType: string, stance: CadenceStance): string {
  return `${conceptId}.${atomType.replace(/_/g, '-')}.${stance}`;
}

/** Path a variant belongs at, relative to the repo root. */
export function variantPathFor(
  conceptId: string,
  atomType: string,
  stance: CadenceStance,
): string {
  const stem = atomType.replace(/_/g, '-');
  return path.join(
    'modules/project-vidhya-content/concepts',
    conceptId,
    'atoms',
    `${stem}-${stance}.md`,
  );
}

/**
 * Frontmatter for the variant, carried over from the base.
 *
 * `bloom_level`, `difficulty` and `exam_ids` are the base's — a variant is the
 * same atom in a different register, not a different atom, and letting a
 * generator restate them invites drift on fields nothing downstream would
 * check.
 */
export function assembleVariantFile(input: {
  baseRaw: string;
  stance: CadenceStance;
  body: string;
  conceptId: string;
  atomType: string;
}): string {
  const base = parseAtom(input.baseRaw);
  const fm = input.baseRaw.match(/^---\n([\s\S]*?)\n---/);
  const carried: string[] = [];
  if (fm) {
    for (const line of fm[1].split('\n')) {
      // Skip comments, the base's identity, and any variant markers it should
      // not have had in the first place.
      if (/^\s*#/.test(line)) continue;
      if (/^(id|variant_of|for_stance):/.test(line)) continue;
      if (line.trim()) carried.push(line);
    }
  }
  const header = [
    '---',
    `# Alternative body for ${base.id ?? input.conceptId}, served when the learner`,
    `# stance is \`${input.stance}\`. The base file is what a steady student reads.`,
    '# Generated by src/generation/variant-generator.ts and checked against the',
    '# base by src/content/variant-agreement.ts before being written.',
    `id: ${variantIdFor(input.conceptId, input.atomType, input.stance)}`,
    ...carried,
    `variant_of: ${base.id ?? input.conceptId}`,
    `for_stance: ${input.stance}`,
    '---',
    '',
  ].join('\n');
  return `${header}${input.body.trim()}\n`;
}

/** The instruction sent to the model, base body included. */
export function buildVariantPrompt(req: VariantRequest): string {
  const base = parseAtom(req.baseRaw);
  const instruction = buildStanceInstruction({
    stance: req.stance,
    atomType: req.atomType,
    topicGuidance: req.topicGuidance,
    baseProseWords: req.stance === 'shaken' ? countProseWords(base.body) : undefined,
  });
  return [
    `Rewrite the lesson body below for a ${req.stance} learner.`,
    instruction,
    'Rules that are checked mechanically and will reject your output:',
    '- Reproduce every fenced ```interactive-spec``` block EXACTLY as given, unless it is a guided_walkthrough, whose prompts and hints you may rewrite and whose steps you may add to. Every answer the base asserts must still appear, in order, ending on the same final answer.',
    '- Do not invent a manipulable or simulation block.',
    '- No heading above level two. No emoji.',
    '- Return the body only. No frontmatter, no commentary, no sign-off.',
    '',
    '--- BASE BODY ---',
    base.body,
  ].join('\n\n');
}

/**
 * Run the gate's rules against a candidate before it is allowed to land.
 * Same function CI calls, so a pass here is a pass there.
 */
export function validateGenerated(
  baseRaw: string,
  variantRaw: string,
  relPath: string,
): Violation[] {
  return checkPair(baseRaw, variantRaw, relPath);
}

export async function generateVariant(
  req: VariantRequest,
  deps: GeneratorDeps,
): Promise<GenerateOutcome> {
  const base = parseAtom(req.baseRaw);
  const target = variantPathFor(req.conceptId, req.atomType, req.stance);
  const draft = path.join(DRAFT_DIR, `${req.conceptId}.${req.atomType}.${req.stance}.md`);

  let body: string;
  try {
    body = await deps.generate(buildVariantPrompt(req));
  } catch (err) {
    return { status: 'refused', draftPath: draft, reason: `generation failed: ${(err as Error).message}` };
  }
  if (!body?.trim()) {
    return { status: 'refused', draftPath: draft, reason: 'model returned an empty body' };
  }

  const file = assembleVariantFile({
    baseRaw: req.baseRaw,
    stance: req.stance,
    body,
    conceptId: req.conceptId,
    atomType: req.atomType,
  });

  // Structure first: it is free, deterministic, and a violation here means the
  // judge would be asked to reason about something already known to be wrong.
  const violations = validateGenerated(req.baseRaw, file, target);
  if (violations.length > 0) {
    await deps.writeFile(draft, file);
    return {
      status: 'refused',
      draftPath: draft,
      reason: violations.map((v) => `[${v.rule}] ${v.detail}`).join('; '),
      violations,
    };
  }

  let verdict: JudgeVerdict;
  try {
    verdict = await deps.judge({
      baseBody: base.body,
      variantBody: body,
      atomType: req.atomType,
    });
  } catch (err) {
    // Fail closed. A judge that cannot answer is not a judge that approved.
    await deps.writeFile(draft, file);
    return { status: 'refused', draftPath: draft, reason: `judge unavailable: ${(err as Error).message}` };
  }
  if (!verdict.agrees) {
    await deps.writeFile(draft, file);
    return { status: 'refused', draftPath: draft, reason: verdict.reason ?? 'judge did not agree' };
  }

  await deps.writeFile(target, file);
  return { status: 'written', path: target, proseWords: countProseWords(body) };
}
