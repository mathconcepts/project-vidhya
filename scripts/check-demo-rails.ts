#!/usr/bin/env npx tsx
/**
 * check-demo-rails — validate the journey card deck at `config/demo-rails.json`.
 *
 * The CEO plan's D3.6 acceptance condition is "every shipped card is QA-walked
 * end to end; a card that dead-ends is pulled, not shipped." A visitor tapping
 * a card and landing on an empty screen is the single most expensive failure in
 * the demo, because it happens in the first ten seconds and it happens in front
 * of someone who came to decide whether the product is real.
 *
 * Hand-walking every card before every demo does not survive contact with a
 * seven-day schedule, so the walk is encoded here instead:
 *
 *   - the persona resolves to a real file in data/personas/
 *   - every atom named by the rail exists on disk
 *   - every interactive block in those atoms PARSES (reusing the renderer's own
 *     validator via lint-interactive-specs' contract) — an atom whose widget
 *     silently returns null is a dead beat in the middle of a rail, which is
 *     exactly the class of bug that made 50 of 101 blocks invisible
 *   - the rail's concept appears in the persona's initial_mastery, so a card
 *     claiming "weak in linear algebra" cannot sit on a profile that has no
 *     linear-algebra mastery (the D3.2 fixture-coherence requirement, which is
 *     easy to break by accident when cards and personas are edited separately)
 *
 * Opt out of the last check per card with `"first_exposure": true` on the rail —
 * legitimate when the card's whole point is meeting a concept cold. Explicit,
 * so the intent is visible in review rather than inferred from a silent pass.
 *
 * Usage: npx tsx scripts/check-demo-rails.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseInteractiveSpec } from '../frontend/src/components/lesson/interactives/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// Optional path argument so the guard itself can be exercised against fixture
// configs — a validator nobody has watched fail is a validator nobody trusts.
const RAILS = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'config/demo-rails.json');
const PERSONAS = path.join(ROOT, 'data/personas');
const CONCEPTS = path.join(ROOT, 'modules/project-vidhya-content/concepts');

const AUDIENCES = new Set(['student', 'teacher', 'principal']);
const RAIL_KINDS = new Set(['atoms', 'compare', 'surfaces']);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors: string[] = [];
const fail = (cardId: string, msg: string) => errors.push(`  card "${cardId}"\n      ${msg}`);

/**
 * Read a persona's declared mastery keys without pulling in the YAML loader.
 *
 * Indentation-aware rather than regex-delimited: the block ends at the first
 * non-empty line indented no deeper than `initial_mastery:` itself. A lookahead
 * for "the next key" does not work here, because every mastery entry IS a key —
 * it terminates the block immediately and reports an empty mastery vector,
 * which reads as "this persona declares no mastery" and fails every card.
 */
function personaMasteryKeys(personaId: string): string[] | null {
  const file = path.join(PERSONAS, `${personaId}.yaml`);
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  const start = lines.findIndex((l) => /^\s*initial_mastery:\s*$/.test(l));
  if (start === -1) return [];
  const baseIndent = lines[start].match(/^\s*/)![0].length;

  const keys: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) continue;
    const indent = line.match(/^\s*/)![0].length;
    if (indent <= baseIndent) break;
    const entry = line.match(/^\s*([A-Za-z0-9._-]+):\s*[\d.]+\s*$/);
    if (entry) keys.push(entry[1]);
  }
  return keys;
}

function checkAtomRail(card: any, rail: any): void {
  const conceptDir = path.join(CONCEPTS, rail.concept_id ?? '');
  if (!rail.concept_id || !fs.existsSync(conceptDir)) {
    fail(card.id, `rail.concept_id "${rail.concept_id}" is not a concept in the content module`);
    return;
  }
  if (!Array.isArray(rail.atoms) || rail.atoms.length === 0) {
    fail(card.id, 'rail.atoms must list at least one atom — an empty rail IS the dead end');
    return;
  }

  for (const atom of rail.atoms) {
    const file = path.join(conceptDir, 'atoms', `${atom}.md`);
    if (!fs.existsSync(file)) {
      fail(card.id, `atom "${atom}" does not exist at ${path.relative(ROOT, file)}`);
      continue;
    }
    const body = fs.readFileSync(file, 'utf8');
    if (!body.includes('```interactive-spec')) continue;
    const parsed = parseInteractiveSpec(body);
    if (!parsed.ok) {
      fail(
        card.id,
        `atom "${atom}" carries an interactive-spec that does not parse (${parsed.reason}) — ` +
          `it renders as nothing, so this beat of the rail is blank`,
      );
    }
  }

  if (rail.first_exposure === true) return;
  const mastery = personaMasteryKeys(card.persona);
  if (mastery && !mastery.includes(rail.concept_id)) {
    fail(
      card.id,
      `persona "${card.persona}" declares no initial_mastery for "${rail.concept_id}", so the ` +
        `card's premise is not backed by its fixture. Add the concept to the persona's mastery ` +
        `vector, or set "first_exposure": true on the rail if meeting it cold is the point.`,
    );
  }
}

/**
 * Words that turn a caption from narration into a pitch.
 *
 * The plan's standing law is that captions "narrate product behavior … never
 * puffery", and the demo's whole posture is that it does not oversell. A
 * caption is the easiest place for marketing voice to appear, because it is
 * the one piece of copy written to be read aloud in front of a visitor.
 */
const PUFFERY = [
  'revolutionary', 'seamless', 'powerful', 'amazing', 'incredible', 'magical',
  'game-changing', 'cutting-edge', 'effortless', 'best-in-class', 'world-class',
  'unleash', 'transform your', 'supercharge',
];

/**
 * Captions anchor to rail STEPS, not DOM selectors.
 *
 * The plan's H4-5 temporal interrogation names this directly: "anchoring
 * captions to DOM elements is where the medium risk lives; anchor to rail
 * STEPS, not selectors, wherever possible — a caption between screens can't
 * miss its target." Enforcing it here is what makes
 * `CaptionTargetMissingError` structurally impossible rather than handled.
 */
function checkCaptions(card: any): void {
  if (card.captions === undefined) return;
  if (!Array.isArray(card.captions)) {
    fail(card.id, 'captions must be an array');
    return;
  }

  const kind = card.rail?.kind;
  const validAnchors: string[] =
    kind === 'atoms'
      ? (card.rail.atoms ?? [])
      : kind === 'surfaces'
        ? (card.rail.steps ?? []).map((s: any) => s?.at).filter(Boolean)
        : ['compare'];

  const seen = new Set<string>();
  for (const [i, caption] of card.captions.entries()) {
    if (!caption || typeof caption.at !== 'string' || typeof caption.text !== 'string') {
      fail(card.id, `captions[${i}] needs both "at" and "text"`);
      continue;
    }
    if (!validAnchors.includes(caption.at)) {
      fail(
        card.id,
        `captions[${i}].at "${caption.at}" is not a step of this card's rail ` +
          `(${validAnchors.join(', ')}) — the caption would never be shown`,
      );
    }
    if (seen.has(caption.at)) {
      fail(card.id, `two captions anchored to "${caption.at}"; only the first would show`);
    }
    seen.add(caption.at);

    const lower = caption.text.toLowerCase();
    const hit = PUFFERY.find((w) => lower.includes(w));
    if (hit) {
      fail(
        card.id,
        `captions[${i}] contains "${hit}" — captions narrate what the product did, ` +
          `they do not sell it`,
      );
    }
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(caption.text)) {
      fail(card.id, `captions[${i}] contains emoji — the design system forbids emoji anywhere`);
    }
  }
}

/**
 * A surfaces rail walks product screens in order — the principal's drill-down
 * from an aggregate to one student's one attempt.
 *
 * Routes are checked for shape, not resolved against the router: the validator
 * runs in node with no React tree to ask. What it CAN guarantee is that each
 * step is addressable and distinctly anchored, so a caption cannot silently
 * attach to the wrong screen and the rail cannot contain a step you can never
 * navigate to.
 */
function checkSurfacesRail(card: any, rail: any): void {
  if (!Array.isArray(rail.steps) || rail.steps.length === 0) {
    fail(card.id, 'surfaces rail needs steps[] — an empty rail IS the dead end');
    return;
  }
  const seen = new Set<string>();
  for (const [i, step] of rail.steps.entries()) {
    if (!step || typeof step.at !== 'string' || !step.at) {
      fail(card.id, `steps[${i}] needs an "at" anchor for its caption`);
      continue;
    }
    if (seen.has(step.at)) {
      fail(card.id, `two steps anchored to "${step.at}" — captions could not tell them apart`);
    }
    seen.add(step.at);
    if (typeof step.route !== 'string' || !step.route.startsWith('/')) {
      fail(card.id, `steps[${i}].route must be an in-app path starting with "/"`);
    }
    if (typeof step.label !== 'string' || !step.label) {
      fail(card.id, `steps[${i}] needs a label — it is what the visitor taps to advance`);
    }
  }
}

function checkCompareRail(card: any, rail: any): void {
  if (!rail.concept_id || !fs.existsSync(path.join(CONCEPTS, rail.concept_id))) {
    fail(card.id, `rail.concept_id "${rail.concept_id}" is not a concept in the content module`);
  }
  if (!rail.against_persona) {
    fail(card.id, 'compare rail needs `against_persona` — a side-by-side needs two sides');
    return;
  }
  if (!fs.existsSync(path.join(PERSONAS, `${rail.against_persona}.yaml`))) {
    fail(card.id, `against_persona "${rail.against_persona}" has no file in data/personas/`);
  }
  if (rail.against_persona === card.persona) {
    fail(
      card.id,
      'compare rail sets against_persona equal to persona — the two panes would be identical, ' +
        'which demonstrates the opposite of what the card claims',
    );
  }
}

function main(): void {
  if (!fs.existsSync(RAILS)) {
    console.error(`check-demo-rails: ${path.relative(ROOT, RAILS)} not found`);
    process.exit(1);
  }

  let config: any;
  try {
    config = JSON.parse(fs.readFileSync(RAILS, 'utf8'));
  } catch (e) {
    console.error(`check-demo-rails: config is not valid JSON — ${(e as Error).message}`);
    process.exit(1);
  }

  if (config.version !== 1) {
    console.error(`check-demo-rails: unsupported config version ${config.version}`);
    process.exit(1);
  }
  if (!Array.isArray(config.cards) || config.cards.length === 0) {
    // An empty deck would render an empty /demo home in front of a visitor.
    console.error('check-demo-rails: cards[] is empty — /demo would show an empty deck');
    process.exit(1);
  }

  const seen = new Set<string>();
  for (const card of config.cards) {
    const id = card?.id ?? '(missing id)';
    if (!card.id || !SLUG.test(card.id)) fail(id, 'id must be a lowercase slug');
    if (seen.has(card.id)) fail(id, 'duplicate card id');
    seen.add(card.id);

    if (!card.title) fail(id, 'title is what the visitor reads on the card — required');
    if (!AUDIENCES.has(card.audience)) {
      fail(id, `audience "${card.audience}" is not one of ${[...AUDIENCES].join(', ')}`);
    }
    if (!card.persona || !fs.existsSync(path.join(PERSONAS, `${card.persona}.yaml`))) {
      fail(id, `persona "${card.persona}" has no file in data/personas/`);
      continue;
    }

    const rail = card.rail;
    if (!rail || !RAIL_KINDS.has(rail.kind)) {
      fail(id, `rail.kind must be one of ${[...RAIL_KINDS].join(', ')}`);
      continue;
    }
    if (rail.kind === 'atoms') checkAtomRail(card, rail);
    else if (rail.kind === 'surfaces') checkSurfacesRail(card, rail);
    else checkCompareRail(card, rail);
    checkCaptions(card);
  }

  if (errors.length > 0) {
    console.error(`\n✗ demo rails: ${errors.length} problem(s)\n`);
    console.error(errors.join('\n'));
    console.error('');
    process.exit(1);
  }
  console.log(`✓ demo rails: ${config.cards.length} card(s) valid and walkable`);
}

main();
