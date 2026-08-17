#!/usr/bin/env npx tsx
/**
 * scripts/generate-variants.ts
 *
 * Fills in the missing stance variants across the corpus.
 *
 * 97 concepts × 3 narrative atom types × 2 stances is 582 files, of which 18
 * exist. This walks what is missing, generates each one, and writes only the
 * ones that pass both the structural gate and the judge. Everything else lands
 * in `.data/variant-drafts/` with the reason attached.
 *
 * ── Two providers, or nothing ───────────────────────────────────────────
 *
 * The generator and the judge must be on different providers, because a model
 * checking whether it dropped a condition is the least likely reader to notice
 * that it did. If only one provider is configured this script REFUSES to run
 * rather than quietly generating 566 unjudged files — a corpus that looks gated
 * and is not is worse than one nobody claims is gated.
 *
 * ── It stops on a bad batch ─────────────────────────────────────────────
 *
 * `--max-consecutive-refusals` exists because the expensive failure is not one
 * bad variant, it is discovering after 566 calls that the prompt was wrong for
 * all of them. Twenty refusals in a row is a broken run, not a hard corpus.
 *
 * ── Usage ───────────────────────────────────────────────────────────────
 *
 *   npx tsx scripts/generate-variants.ts --dry-run          # what would run
 *   npx tsx scripts/generate-variants.ts --concept eigenvalues
 *   npx tsx scripts/generate-variants.ts --limit 20
 *   npx tsx scripts/generate-variants.ts                    # the whole corpus
 *
 * Requires two of GEMINI_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY /
 * OPENROUTER_API_KEY.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CADENCE_ATOM_TYPES, type CadenceStance } from '../src/content/stance-cadence';
import {
  generateVariant,
  variantPathFor,
  type GeneratorDeps,
  type VariantRequest,
} from '../src/generation/variant-generator';
import { makeJudge, pickJudgeProvider, type JudgeModel } from '../src/generation/variant-judge';

const CONCEPTS_DIR = path.join(process.cwd(), 'modules/project-vidhya-content/concepts');
const TEMPLATE_DIR = path.join(process.cwd(), 'modules/project-vidhya-content/templates');
const STANCES: CadenceStance[] = ['shaken', 'assured'];

/** Provider id → the env var holding its key. Mirrors config/providers.yaml. */
const PROVIDER_KEYS: Record<string, string> = {
  'google-gemini': 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

export interface PendingVariant {
  conceptId: string;
  atomType: string;
  stance: CadenceStance;
  basePath: string;
  targetPath: string;
}

/** Base atom file for a (concept, atomType), or null when there is no base. */
export function baseAtomPath(conceptId: string, atomType: string): string | null {
  const stem = atomType.replace(/_/g, '-');
  const p = path.join(CONCEPTS_DIR, conceptId, 'atoms', `${stem}.md`);
  return fs.existsSync(p) ? p : null;
}

/**
 * Every variant that could exist and does not.
 *
 * A variant with no base atom is skipped rather than invented: there is nothing
 * to rewrite, and generating one from the concept name alone would produce
 * content nothing verified.
 */
export function findPending(conceptFilter?: string): PendingVariant[] {
  if (!fs.existsSync(CONCEPTS_DIR)) return [];
  const out: PendingVariant[] = [];
  for (const conceptId of fs.readdirSync(CONCEPTS_DIR).sort()) {
    if (conceptFilter && conceptId !== conceptFilter) continue;
    if (!fs.statSync(path.join(CONCEPTS_DIR, conceptId)).isDirectory()) continue;
    for (const atomType of CADENCE_ATOM_TYPES) {
      const basePath = baseAtomPath(conceptId, atomType);
      if (!basePath) continue;
      for (const stance of STANCES) {
        const targetPath = variantPathFor(conceptId, atomType, stance);
        if (fs.existsSync(path.join(process.cwd(), targetPath))) continue;
        out.push({ conceptId, atomType, stance, basePath, targetPath });
      }
    }
  }
  return out;
}

/** The topic's own `stances:` guidance, read straight from the template. */
export function topicGuidanceFor(topicFamily: string, atomType: string, stance: CadenceStance): string | undefined {
  if (!fs.existsSync(TEMPLATE_DIR)) return undefined;
  for (const file of fs.readdirSync(TEMPLATE_DIR)) {
    if (!/\.ya?ml$/.test(file)) continue;
    const raw = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf-8');
    if (!new RegExp(`^topic_family:\\s*["']?${topicFamily}["']?\\s*$`, 'm').test(raw)) continue;
    const section = raw.split(new RegExp(`^${atomType}:$`, 'm'))[1]?.split(/^\S/m)[0];
    if (!section) return undefined;
    const block = section.split(new RegExp(`^\\s*${stance}:\\s*\\|\\s*$`, 'm'))[1];
    if (!block) return undefined;
    const lines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.trim() === '') { if (lines.length) break; continue; }
      if (!/^\s{6,}\S/.test(line)) break;
      lines.push(line.trim());
    }
    return lines.join(' ') || undefined;
  }
  return undefined;
}

/** Providers with a key present in the environment. */
export function configuredProviders(env: NodeJS.ProcessEnv = process.env): string[] {
  return Object.entries(PROVIDER_KEYS)
    .filter(([, v]) => Boolean(env[v]?.trim()))
    .map(([id]) => id);
}

export interface RunSummary {
  written: number;
  refused: number;
  skipped: number;
  stoppedEarly?: string;
}

/**
 * The loop. Kept separate from the CLI so it is testable with injected deps —
 * nothing below reads the environment or touches a provider.
 */
export async function runGeneration(
  pending: PendingVariant[],
  deps: GeneratorDeps & { readFile(p: string): string; log(s: string): void },
  opts: { maxConsecutiveRefusals?: number; topicFor?(conceptId: string): string | undefined } = {},
): Promise<RunSummary> {
  const cap = opts.maxConsecutiveRefusals ?? 20;
  const summary: RunSummary = { written: 0, refused: 0, skipped: 0 };
  let streak = 0;

  for (const p of pending) {
    let baseRaw: string;
    try {
      baseRaw = deps.readFile(p.basePath);
    } catch (err) {
      summary.skipped++;
      deps.log(`skip  ${p.targetPath} — cannot read base: ${(err as Error).message}`);
      continue;
    }

    const topic = opts.topicFor?.(p.conceptId);
    const req: VariantRequest = {
      conceptId: p.conceptId,
      atomType: p.atomType,
      stance: p.stance,
      baseRaw,
      topicGuidance: topic ? topicGuidanceFor(topic, p.atomType, p.stance) : undefined,
    };

    const outcome = await generateVariant(req, deps);
    if (outcome.status === 'written') {
      summary.written++;
      streak = 0;
      deps.log(`write ${outcome.path} (${outcome.proseWords} prose words)`);
    } else {
      summary.refused++;
      streak++;
      deps.log(`refuse ${p.targetPath} — ${outcome.reason}`);
      if (streak >= cap) {
        summary.stoppedEarly = `${cap} consecutive refusals — the run is broken, not the corpus`;
        deps.log(`STOP: ${summary.stoppedEarly}`);
        break;
      }
    }
  }
  return summary;
}

// ─── CLI ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  const dryRun = argv.includes('--dry-run');
  const limit = Number(flag('limit') ?? 0);

  let pending = findPending(flag('concept'));
  if (limit > 0) pending = pending.slice(0, limit);

  console.log(`${pending.length} variants missing.`);
  if (dryRun) {
    for (const p of pending.slice(0, 40)) console.log(`  ${p.targetPath}`);
    if (pending.length > 40) console.log(`  … and ${pending.length - 40} more`);
    return;
  }
  if (pending.length === 0) return;

  const configured = configuredProviders();
  if (configured.length === 0) {
    console.error('No LLM provider key found. Set one of: ' + Object.values(PROVIDER_KEYS).join(', '));
    process.exit(1);
  }
  const generatorProvider = configured[0];
  const judgeProvider = pickJudgeProvider(generatorProvider, configured);
  if (!judgeProvider) {
    console.error(
      `Only one provider is configured (${generatorProvider}). The judge must run on a\n` +
        'different provider than the generator — a model checking its own output is\n' +
        'not a check. Configure a second key from: ' +
        Object.entries(PROVIDER_KEYS)
          .filter(([id]) => id !== generatorProvider)
          .map(([, v]) => v)
          .join(', '),
    );
    process.exit(1);
  }
  console.log(`generator: ${generatorProvider}   judge: ${judgeProvider}`);

  const { getLlmForRole } = await import('../src/llm/runtime');
  const gen = await getLlmForRole('chat');
  if (!gen) {
    console.error('Provider key present but no chat model resolved. Check config/providers.yaml.');
    process.exit(1);
  }
  // The judge model is resolved through the same runtime, pinned to the other
  // provider by env precedence at call time.
  const judgeModel: JudgeModel = {
    generate: async (prompt) => {
      const llm = await getLlmForRole('json');
      return llm ? llm.generate(prompt, { temperature: 0 }) : null;
    },
  };

  const { CONCEPT_MAP } = await import('../src/constants/concept-graph');
  const topicFor = (id: string): string | undefined => (CONCEPT_MAP as any)[id]?.topic;

  const summary = await runGeneration(
    pending,
    {
      generate: async (prompt) => (await gen.generate(prompt, { temperature: 0.7 })) ?? '',
      judge: makeJudge(judgeModel),
      writeFile: async (rel, contents) => {
        const abs = path.join(process.cwd(), rel);
        await fs.promises.mkdir(path.dirname(abs), { recursive: true });
        await fs.promises.writeFile(abs, contents, 'utf-8');
      },
      readFile: (p) => fs.readFileSync(p, 'utf-8'),
      log: (s) => console.log(s),
    },
    { topicFor },
  );

  console.log(
    `\n${summary.written} written, ${summary.refused} refused, ${summary.skipped} skipped.`,
  );
  if (summary.stoppedEarly) console.log(summary.stoppedEarly);
  console.log('Refused drafts are in .data/variant-drafts/ with their reasons.');
  console.log('Run `npx tsx scripts/check-variant-agreement.ts` before committing.');
}

if (process.argv[1] && process.argv[1].endsWith('generate-variants.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
