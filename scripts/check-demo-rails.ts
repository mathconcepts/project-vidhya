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
 * The deck is not the only thing a visitor's first ten seconds depend on. This
 * gate also asserts the demo deploy's committed blueprint turns the intent
 * lanes ON (`VIDHYA_INTENT_LANES=on` in render.yaml) — see checkIntentLanes
 * below for why a flag deserves a CI assertion at all.
 *
 * Usage: npx tsx scripts/check-demo-rails.ts [railsPath] [renderBlueprintPath]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { parseInteractiveSpec } from '../frontend/src/components/lesson/interactives/types';
import { VARIANT_STANCES } from '../src/content/stance-variants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// Optional path argument so the guard itself can be exercised against fixture
// configs — a validator nobody has watched fail is a validator nobody trusts.
const RAILS = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'config/demo-rails.json');
// Same reason as RAILS above: the lanes-on assertion is only trustworthy if
// someone has watched it fail, and that needs a blueprint it can be pointed at.
const RENDER_BLUEPRINT = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, 'render.yaml');
const PERSONAS = path.join(ROOT, 'data/personas');
const CONCEPTS = path.join(ROOT, 'modules/project-vidhya-content/concepts');
const PRACTICE_ITEMS = path.join(ROOT, 'data', 'practice-items');
const SCENARIO_RUNS = process.env.VIDHYA_SCENARIO_ROOT
  ? path.resolve(process.env.VIDHYA_SCENARIO_ROOT)
  : path.join(ROOT, '.data', 'scenarios');

/**
 * Every authored practice item, by id.
 *
 * Read here rather than imported so the validator stays dependency-light, but
 * the checks below mirror what FileLearningObjectCatalog will actually serve:
 * an item that exists but carries no answer key parses fine and then refuses to
 * grade at the route, which would strand the visitor on the last step of the
 * rail — the step whose entire purpose is an earned mark.
 */
function loadPracticeItems(): Map<string, any> {
  const out = new Map<string, any>();
  try {
    for (const file of fs.readdirSync(PRACTICE_ITEMS)) {
      if (!file.endsWith('.json')) continue;
      const raw = JSON.parse(fs.readFileSync(path.join(PRACTICE_ITEMS, file), 'utf8'));
      for (const item of raw.items ?? []) if (item?.id) out.set(item.id, item);
    }
  } catch {
    /* no authored items on this deployment */
  }
  return out;
}
const PRACTICE = loadPracticeItems();

const AUDIENCES = new Set(['student', 'teacher', 'principal']);
const RAIL_KINDS = new Set(['atoms', 'compare', 'surfaces']);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * The role a destination demands, and the ranking used to compare it against
 * the role the card's persona is seeded at.
 *
 * This exists because the deck shipped two cards that resolved, parsed, and
 * passed every other check here, and still dead-ended: they signed the visitor
 * in as a student and sent them to `/teaching` and `/admin/scenarios`, which
 * answer "Teacher role required" and 403. Every part was present; the walk was
 * impossible. Checking the parts is not checking the journey.
 *
 * Prefix-matched longest-first, so `/admin/scenarios` is not read as `/admin`
 * by accident. A route with no entry is treated as reachable by anyone —
 * absence of a rule is not evidence of a gate, and guessing would produce
 * failures the author cannot act on.
 */
const ROLE_RANK: Record<string, number> = { student: 1, teacher: 2, admin: 3 };
const ROUTE_MIN_ROLE: Array<[string, string]> = [
  ['/admin', 'admin'],
  ['/teaching', 'teacher'],
  ['/teacher', 'teacher'],
];

function requiredRoleFor(route: string): string | null {
  const hit = [...ROUTE_MIN_ROLE]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => route === prefix || route.startsWith(prefix + '/'));
  return hit ? hit[1] : null;
}

/** The role a persona's demo account is seeded at; absent means student. */
function personaRole(personaId: string): string {
  try {
    const raw = fs.readFileSync(path.join(PERSONAS, `${personaId}.yaml`), 'utf8');
    return raw.match(/^demo_role:\s*(\S+)/m)?.[1] ?? 'student';
  } catch {
    return 'student';
  }
}

/**
 * Every route a card can put the visitor on, entry included.
 *
 * Kept next to the reachability check rather than imported from the frontend:
 * the page derives these for rendering, this derives them to prove the journey
 * is walkable, and a shared helper would let a rendering change quietly relax
 * the guard.
 */
function railRoutes(card: any): string[] {
  const rail = card.rail ?? {};
  if (rail.kind === 'surfaces') return (rail.steps ?? []).map((s: any) => s?.route).filter(Boolean);
  if (rail.kind === 'compare') return ['/admin/scenarios'];
  const routes = [`/lesson/${rail.concept_id}`];
  if (rail.practice_item_id) routes.push(`/attempt/${rail.practice_item_id}`);
  if (rail.invite_doubt) routes.push('/demo/doubt');
  return routes;
}

function checkReachability(card: any): void {
  const role = personaRole(card.persona);
  for (const route of railRoutes(card)) {
    const needed = requiredRoleFor(route);
    if (!needed) continue;
    if ((ROLE_RANK[role] ?? 0) < (ROLE_RANK[needed] ?? 0)) {
      fail(
        card.id,
        `rail sends the visitor to "${route}", which needs role "${needed}", but persona ` +
          `"${card.persona}" is seeded as "${role}" — the card would dead-end on a permissions ` +
          `refusal. Give the persona "demo_role: ${needed}" or route the card somewhere it can go.`,
      );
    }
  }
}

const errors: string[] = [];
const fail = (cardId: string, msg: string) => errors.push(`  card "${cardId}"\n      ${msg}`);
/** Deploy-level problems are not any one card's fault, so they are labelled by
 * the file that carries them rather than by a card id. */
const failDeploy = (msg: string) =>
  errors.push(`  ${path.relative(ROOT, RENDER_BLUEPRINT)}\n      ${msg}`);

const INTENT_LANES_KEY = 'VIDHYA_INTENT_LANES';
const INTENT_LANES_EXPECTED = 'on';

/**
 * The demo deploy's committed blueprint must turn the intent lanes ON.
 *
 * Every check above asks whether the content behind a card exists. This one
 * asks whether the visitor is shown it at all. The Definite Problem Statement
 * block and the intent-ordered atom sequence render only when
 * `/api/auth/config` reports `intent_lanes: true`, which is
 * `VIDHYA_INTENT_LANES === 'on'` in `src/api/auth-routes.ts` — so with the flag
 * off the whole of T4 is shipped, tested, deployed and invisible, and every
 * other check in this file still passes.
 *
 * That is not hypothetical: the block shipped behind this flag, the flag was
 * never set on the demo, and the same feedback ("the demo opens on a concept
 * page with no problem statement") came back a second time against code that
 * had already fixed it. An unwatched flag is the failure mode; a gate is the
 * only thing that watches one.
 *
 * Reading the committed blueprint rather than `process.env` is deliberate. CI
 * does not run with the demo's environment, and a flag set only in the Render
 * dashboard is invisible to review and does not survive service recreation.
 * The blueprint is the artifact the deploy is actually built from.
 */
function checkIntentLanes(): void {
  if (!fs.existsSync(RENDER_BLUEPRINT)) {
    failDeploy(
      `blueprint not found, so nothing proves the demo deploy sets ${INTENT_LANES_KEY}\n` +
        `      actual:   no file at this path\n` +
        `      expected: a Render blueprint declaring ${INTENT_LANES_KEY}: "${INTENT_LANES_EXPECTED}"`,
    );
    return;
  }

  let blueprint: any;
  try {
    blueprint = parseYaml(fs.readFileSync(RENDER_BLUEPRINT, 'utf8'));
  } catch (e) {
    failDeploy(`blueprint is not valid YAML — ${(e as Error).message}`);
    return;
  }

  const services = Array.isArray(blueprint?.services) ? blueprint.services : [];
  if (services.length === 0) {
    failDeploy(
      `blueprint declares no services[], so no service turns the intent lanes on\n` +
        `      actual:   services[] is missing or empty\n` +
        `      expected: at least one service with ${INTENT_LANES_KEY}: "${INTENT_LANES_EXPECTED}" in envVars`,
    );
    return;
  }

  for (const service of services) {
    const name = service?.name ?? '(unnamed service)';
    const envVars: any[] = Array.isArray(service?.envVars) ? service.envVars : [];
    const entry = envVars.find((v) => v?.key === INTENT_LANES_KEY);
    const actual =
      entry === undefined
        ? 'not declared at all'
        : entry.value === undefined
          ? `declared with no value (${JSON.stringify(entry)}) — an operator-supplied key, not a committed one`
          : `"${String(entry.value)}"`;

    if (entry !== undefined && String(entry.value) === INTENT_LANES_EXPECTED) continue;

    failDeploy(
      `service "${name}" does not turn the intent lanes on, so the demo would open concept ` +
        `pages with the problem-statement block shipped and invisible\n` +
        `      actual:   ${INTENT_LANES_KEY} ${actual}\n` +
        `      expected: ${INTENT_LANES_KEY}: "${INTENT_LANES_EXPECTED}" in this service's envVars`,
    );
  }
}

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
    // Every atom a demo rail walks must have an authored body for BOTH
    // stances. The deck's whole claim is that two named students opening the
    // same concept do not see the same lesson — and a missing variant does not
    // announce itself: applyStanceVariants falls back to the base body, so the
    // rail still walks and the demo silently shows one lesson while narrating
    // two students. That failure is invisible on stage and obvious in CI, so
    // it belongs here.
    for (const stance of VARIANT_STANCES) {
      const variant = path.join(conceptDir, 'atoms', `${atom}-${stance}.md`);
      if (!fs.existsSync(variant)) {
        fail(
          card.id,
          `atom "${atom}" has no ${stance} variant at ${path.relative(ROOT, variant)} — ` +
            `a ${stance} persona would silently read the base body, so the deck would ` +
            `narrate two students and show one lesson`,
        );
        continue;
      }
      const vBody = fs.readFileSync(variant, 'utf8');
      if (!/^variant_of:\s*\S/m.test(vBody) || !new RegExp(`^for_stance:\\s*${stance}\\s*$`, 'm').test(vBody)) {
        fail(
          card.id,
          `variant ${path.relative(ROOT, variant)} is missing variant_of / for_stance: ${stance} — ` +
            `the loader would serve it as a SEPARATE atom in the lesson instead of as an alternative body`,
        );
      }
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

  if (rail.invite_doubt && !rail.practice_item_id) {
    // The doubt step closes a rail that already earned something. Inviting a
    // visitor's own problem before they have seen the product answer one is the
    // wrong order, and the step's copy assumes the graded moment happened.
    fail(card.id, 'invite_doubt needs a practice_item_id — it closes the graded rail');
  }

  if (rail.practice_item_id) {
    const item = PRACTICE.get(rail.practice_item_id);
    if (!item) {
      fail(card.id, `practice_item_id "${rail.practice_item_id}" is not in data/practice-items/`);
    } else {
      if (item.concept_id !== rail.concept_id) {
        fail(
          card.id,
          `practice item "${item.id}" is for concept "${item.concept_id}" but the rail teaches ` +
            `"${rail.concept_id}" — the rail would end on a question about something else`,
        );
      }
      const hasKey =
        typeof item.answer_index === 'number' ||
        Array.isArray(item.answer_indices) ||
        Array.isArray(item.answer_range);
      if (!item.question_type || !(item.marks > 0) || !hasKey) {
        fail(
          card.id,
          `practice item "${item.id}" is not gradable (needs question_type, marks > 0 and an ` +
            `answer key) — the rail's last step would refuse to mark the visitor's answer`,
        );
      }
      if (Array.isArray(item.options) && typeof item.answer_index === 'number'
          && item.answer_index >= item.options.length) {
        fail(card.id, `practice item "${item.id}" answer_index is outside its own options list`);
      }
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
      ? [
          ...(card.rail.atoms ?? []),
          ...(card.rail.practice_item_id ? ['practice'] : []),
          ...(card.rail.invite_doubt ? ['doubt'] : []),
        ]
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
    // `when` branches the caption on the graded outcome (D3.3's miss
    // choreography). Uniqueness is per (anchor, when): a step may carry one
    // unconditional caption plus one per outcome, but two captions competing
    // for the same slot means only the first would ever show.
    if (caption.when !== undefined && caption.when !== 'correct' && caption.when !== 'incorrect') {
      fail(card.id, `captions[${i}].when must be "correct" or "incorrect"`);
    }
    // Only an atoms rail with a practice item ever produces a graded outcome.
    // A branch on any other rail kind is dead copy that can never fire — which
    // reads as a scripted moment that silently does not happen.
    const hasGradedStep = card.rail?.kind === 'atoms' && !!card.rail.practice_item_id;
    if (caption.when && !hasGradedStep) {
      fail(
        card.id,
        `captions[${i}] branches on an outcome, but this rail has no graded step — ` +
          `the reframe could never fire`,
      );
    }
    const slot = `${caption.at}::${caption.when ?? ''}`;
    if (seen.has(slot)) {
      fail(card.id, `two captions in slot "${slot}"; only the first would show`);
    }
    seen.add(slot);

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
  // The side-by-side lives on /admin/scenarios, which lists trial runs from
  // disk. With no runs the visitor reaches the page and finds nothing — every
  // part present, nothing to see. That is how this card shipped once, so it is
  // a hard failure now rather than a thing to notice at the venue.
  //
  // Seeding a run needs DATABASE_URL (src/scenarios/persona-seeder.ts), which
  // the offline venue instance does not have. Until that path exists DB-less,
  // a compare card cannot walk, and this check says so out loud.
  const runs = (() => {
    try {
      return fs.readdirSync(SCENARIO_RUNS).filter((d) => !d.startsWith('_'));
    } catch {
      return [];
    }
  })();
  if (runs.length === 0) {
    fail(
      card.id,
      'compare rail lands on /admin/scenarios, but no trial runs exist in .data/scenarios/ — ' +
        'the visitor would reach the page and find an empty list. Seed a run (npm run demo:scenario, ' +
        'needs DATABASE_URL) or pull the card.',
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
    checkReachability(card);
    checkCaptions(card);
  }

  checkIntentLanes();

  if (errors.length > 0) {
    console.error(`\n✗ demo rails: ${errors.length} problem(s)\n`);
    console.error(errors.join('\n'));
    console.error('');
    process.exit(1);
  }
  console.log(
    `✓ demo rails: ${config.cards.length} card(s) valid and walkable; ` +
      `${INTENT_LANES_KEY}=${INTENT_LANES_EXPECTED} in ${path.relative(ROOT, RENDER_BLUEPRINT)}`,
  );
}

main();
